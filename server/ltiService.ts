import express from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import ltijs from 'ltijs';

// LTI configuration interface
interface LTIConfig {
  issuer: string;
  clientId: string;
  keysetUrl: string;
  loginUrl: string;
  redirectUrl: string;
  privateKey: string;
  publicKey: string;
}

// LTI Provider instance
let ltiProvider: any = null;

// Generate RSA key pair for LTI
function generateKeyPair() {
  const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: {
      type: 'spki',
      format: 'pem',
    },
    privateKeyEncoding: {
      type: 'pkcs8',
      format: 'pem',
    },
  });
  
  return { publicKey, privateKey };
}

// Initialize LTI Provider
export async function initializeLTI(app: express.Application) {
  try {
    // Generate or retrieve keys (in production, store these securely)
    const { publicKey, privateKey } = generateKeyPair();
    
    // Initialize LTI provider
    ltiProvider = new ltijs.Provider(process.env.LTI_KEY || 'ProficiencyAI_LTI_Key', {
      url: process.env.DATABASE_URL,
      connection: { 
        user: process.env.PGUSER,
        host: process.env.PGHOST,
        database: process.env.PGDATABASE,
        password: process.env.PGPASSWORD,
        port: parseInt(process.env.PGPORT || '5432'),
        ssl: true
      }
    }, {
      staticPath: '/public',
      cookies: {
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'None'
      },
      devMode: process.env.NODE_ENV === 'development'
    });

    // Setup LTI provider
    await ltiProvider.setup(process.env.LTI_KEY || 'ProficiencyAI_LTI_Key', {
      url: process.env.DATABASE_URL,
      connection: { 
        user: process.env.PGUSER,
        host: process.env.PGHOST,
        database: process.env.PGDATABASE,
        password: process.env.PGPASSWORD,
        port: parseInt(process.env.PGPORT || '5432'),
        ssl: true
      }
    });

    // Register platform (LMS)
    await ltiProvider.registerPlatform({
      url: process.env.LTI_PLATFORM_URL || 'https://canvas.instructure.com',
      name: 'Canvas LMS',
      clientId: process.env.LTI_CLIENT_ID || 'ProficiencyAI',
      authenticationEndpoint: process.env.LTI_AUTH_ENDPOINT || 'https://canvas.instructure.com/api/lti/authorize_redirect',
      accesstokenEndpoint: process.env.LTI_TOKEN_ENDPOINT || 'https://canvas.instructure.com/login/oauth2/token',
      authConfig: { method: 'JWK_SET', key: publicKey }
    });

    // LTI Launch handler
    ltiProvider.onConnect((token: any, req: express.Request, res: express.Response) => {
      console.log('LTI Launch received:', {
        platform: token.iss,
        clientId: token.aud,
        user: token.sub,
        context: token['https://purl.imsglobal.org/spec/lti/claim/context'],
        roles: token['https://purl.imsglobal.org/spec/lti/claim/roles']
      });

      // Extract user information from LTI token
      const userInfo = {
        id: token.sub,
        name: token.name || token.given_name + ' ' + token.family_name,
        email: token.email,
        roles: token['https://purl.imsglobal.org/spec/lti/claim/roles'] || [],
        context: token['https://purl.imsglobal.org/spec/lti/claim/context']
      };

      // Determine user role based on LTI roles
      let userRole = 'student';
      const roles = userInfo.roles;
      if (roles.includes('http://purl.imsglobal.org/vocab/lis/v2/membership#Instructor') ||
          roles.includes('http://purl.imsglobal.org/vocab/lis/v2/membership#TeachingAssistant')) {
        userRole = 'teacher';
      } else if (roles.includes('http://purl.imsglobal.org/vocab/lis/v2/membership#Administrator')) {
        userRole = 'admin';
      }

      // Store LTI session information
      req.session = req.session || {};
      req.session.ltiUser = userInfo;
      req.session.ltiRole = userRole;
      req.session.ltiToken = token;

      // Redirect to appropriate interface based on role
      if (userRole === 'teacher' || userRole === 'admin') {
        return res.redirect('/enhanced-quiz-builder');
      } else {
        return res.redirect('/');
      }
    });

    // Mount LTI provider
    app.use(ltiProvider.app);

    console.log('LTI Provider initialized successfully');
    return ltiProvider;

  } catch (error) {
    console.error('Failed to initialize LTI:', error);
    throw error;
  }
}

// Get LTI configuration for external registration
export function getLTIConfig(): LTIConfig {
  const baseUrl = process.env.NODE_ENV === 'production' 
    ? `https://${process.env.REPLIT_DOMAINS?.split(',')[0]}` 
    : 'http://localhost:5000';

  return {
    issuer: baseUrl,
    clientId: process.env.LTI_CLIENT_ID || 'ProficiencyAI',
    keysetUrl: `${baseUrl}/keys`,
    loginUrl: `${baseUrl}/login`,
    redirectUrl: `${baseUrl}/`,
    privateKey: process.env.LTI_PRIVATE_KEY || '',
    publicKey: process.env.LTI_PUBLIC_KEY || ''
  };
}

// Middleware to check LTI authentication
export function requireLTIAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
  if (req.session?.ltiUser) {
    return next();
  }
  
  // If not LTI authenticated, fall back to regular auth
  return next();
}

// Get current LTI user information
export function getLTIUser(req: express.Request) {
  return req.session?.ltiUser || null;
}

// LTI Grade Passback functionality
export async function sendGradePassback(req: express.Request, score: number, maxScore: number = 100) {
  try {
    if (!ltiProvider || !req.session?.ltiToken) {
      console.log('No LTI context available for grade passback');
      return false;
    }

    const token = req.session.ltiToken;
    const gradeServiceClaim = token['https://purl.imsglobal.org/spec/lti-ags/claim/endpoint'];
    
    if (!gradeServiceClaim) {
      console.log('No grade service endpoint available');
      return false;
    }

    // Calculate percentage score
    const percentageScore = (score / maxScore) * 100;

    // Send grade using LTI AGS (Assignment and Grade Services)
    const gradeResult = await ltiProvider.Grade.ScorePublish(token, {
      scoreGiven: score,
      scoreMaximum: maxScore,
      comment: `Quiz completed in ProficiencyAI - Score: ${score}/${maxScore} (${percentageScore.toFixed(1)}%)`,
      activityProgress: 'Completed',
      gradingProgress: 'FullyGraded'
    });

    console.log('Grade passback successful:', gradeResult);
    return true;

  } catch (error) {
    console.error('Grade passback failed:', error);
    return false;
  }
}

// Deep Linking for content selection
export async function createDeepLink(req: express.Request, res: express.Response, contentItems: any[]) {
  try {
    if (!ltiProvider || !req.session?.ltiToken) {
      return res.status(400).json({ error: 'No LTI context available' });
    }

    const deepLinkResponse = await ltiProvider.DeepLink.createDeepLink(
      req.session.ltiToken,
      contentItems,
      { message: 'Content selected successfully' }
    );

    return res.json(deepLinkResponse);

  } catch (error) {
    console.error('Deep link creation failed:', error);
    return res.status(500).json({ error: 'Failed to create deep link' });
  }
}

export { ltiProvider };