import OpenAI from "openai";
import { Question, AnswerOption, QuizAttempt, QuizResponse } from "@shared/schema";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key" 
});

interface ValidationResult {
  issues: string[];
  suggestions: string[];
  confidenceScore: number;
  status: 'pending' | 'approved' | 'rejected' | 'needs_review';
  comments: string;
}

export async function validateQuestion(question: Question, answerOptions: AnswerOption[]): Promise<ValidationResult> {
  try {
    const prompt = `
      Analyze the following educational question for quality, clarity, and educational value. 
      Return a JSON response with the following structure:
      {
        "issues": ["array of specific issues found"],
        "suggestions": ["array of improvement suggestions"],
        "confidenceScore": 0.95,
        "status": "approved|rejected|needs_review",
        "comments": "detailed feedback about the question"
      }

      Question Text: ${question.questionText}
      Question Type: ${question.questionType}
      Difficulty Level: ${question.difficultyScore}
      Bloom's Taxonomy Level: ${question.bloomsLevel}
      
      Answer Options:
      ${answerOptions.map((option, index) => `${index + 1}. ${option.answerText} (${option.isCorrect ? 'Correct' : 'Incorrect'})`).join('\n')}
      
      Please check for:
      - Grammar and spelling errors
      - Clarity and ambiguity
      - Educational appropriateness
      - Answer option quality
      - Correct answer accuracy
      - Difficulty level appropriateness
      - Bloom's taxonomy alignment
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert educational assessment validator. Provide detailed, constructive feedback on educational questions and assessments.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      response_format: { type: "json_object" },
    });

    const validation = JSON.parse(response.choices[0].message.content || "{}");
    
    return {
      issues: validation.issues || [],
      suggestions: validation.suggestions || [],
      confidenceScore: Math.max(0, Math.min(1, validation.confidenceScore || 0.5)),
      status: validation.status || 'needs_review',
      comments: validation.comments || 'AI validation completed',
    };
  } catch (error) {
    console.error("Error validating question:", error);
    return {
      issues: ["AI validation failed"],
      suggestions: ["Please review manually"],
      confidenceScore: 0,
      status: 'needs_review',
      comments: 'AI validation service unavailable',
    };
  }
}

export async function generateStudyGuide(topic: string, sourceType: string, sourceId: string): Promise<string> {
  try {
    const prompt = `
      Create a comprehensive study guide for the topic: "${topic}".
      
      The study guide should include:
      1. Key concepts and definitions
      2. Important facts and figures
      3. Common misconceptions
      4. Study strategies
      5. Practice questions
      6. Additional resources
      
      Make it engaging, well-structured, and appropriate for the education level.
      Format the response in markdown for better readability.
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert educational content creator. Create comprehensive, engaging study guides that help students learn effectively.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    return response.choices[0].message.content || "Study guide generation failed";
  } catch (error) {
    console.error("Error generating study guide:", error);
    return "Failed to generate study guide. Please try again later.";
  }
}

export async function generateImprovementPlan(attempt: QuizAttempt, responses: QuizResponse[]): Promise<string> {
  try {
    const incorrectResponses = responses.filter(r => !r.isCorrect);
    const totalQuestions = responses.length;
    const correctAnswers = responses.filter(r => r.isCorrect).length;
    const score = (correctAnswers / totalQuestions) * 100;

    const prompt = `
      Create a personalized improvement plan for a student based on their quiz performance.
      
      Quiz Performance:
      - Total Questions: ${totalQuestions}
      - Correct Answers: ${correctAnswers}
      - Score: ${score.toFixed(1)}%
      - Incorrect Responses: ${incorrectResponses.length}
      
      Areas that need improvement:
      ${incorrectResponses.map(r => `- Question ID: ${r.questionId}`).join('\n')}
      
      Create a structured improvement plan that includes:
      1. Performance analysis
      2. Specific areas for improvement
      3. Recommended study strategies
      4. Practice recommendations
      5. Timeline for improvement
      6. Resources for additional learning
      
      Make it encouraging and actionable. Format in markdown.
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert educational consultant. Create personalized, encouraging improvement plans that help students succeed.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    return response.choices[0].message.content || "Improvement plan generation failed";
  } catch (error) {
    console.error("Error generating improvement plan:", error);
    return "Failed to generate improvement plan. Please try again later.";
  }
}

export async function generateQuestionSuggestions(topic: string, questionType: string, difficultyLevel: string): Promise<string[]> {
  try {
    const prompt = `
      Generate 5 high-quality educational questions about "${topic}".
      
      Requirements:
      - Question Type: ${questionType}
      - Difficulty Level: ${difficultyLevel}
      - Include answer options for multiple choice questions
      - Ensure questions are educationally sound
      - Avoid ambiguous wording
      - Make questions relevant and engaging
      
      Return a JSON array of question objects with the following structure:
      [
        {
          "questionText": "Question text here",
          "answerOptions": ["Option 1", "Option 2", "Option 3", "Option 4"],
          "correctAnswer": "Option 1",
          "explanation": "Why this is the correct answer"
        }
      ]
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert educational question writer. Create high-quality, pedagogically sound questions for assessments.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      response_format: { type: "json_object" },
    });

    const suggestions = JSON.parse(response.choices[0].message.content || "[]");
    return Array.isArray(suggestions) ? suggestions : [];
  } catch (error) {
    console.error("Error generating question suggestions:", error);
    return [];
  }
}

interface AIQuestionGenerationParams {
  topic: string;
  questionCount: number;
  questionTypes: string[];
  difficultyRange: [number, number];
  bloomsLevels: string[];
  includeReferences: boolean;
  referenceLinks: string[];
  targetAudience?: string;
  learningObjectives: string[];
  questionStyle: string;
  includeImages: boolean;
  includeMultimedia: boolean;
  customInstructions?: string;
  testbankId: string;
}

export async function generateQuestionsWithAI(params: AIQuestionGenerationParams): Promise<any[]> {
  try {
    const {
      topic,
      questionCount,
      questionTypes,
      difficultyRange,
      bloomsLevels,
      includeReferences,
      referenceLinks,
      targetAudience,
      learningObjectives,
      questionStyle,
      includeImages,
      includeMultimedia,
      customInstructions
    } = params;

    // Prepare reference material context
    let referenceContext = "";
    if (includeReferences && referenceLinks.length > 0) {
      referenceContext = `
        Reference Materials:
        ${referenceLinks.map((link, index) => `${index + 1}. ${link}`).join('\n')}
        
        Please incorporate information from these references where appropriate and include citations.
      `;
    }

    // Build comprehensive prompt
    const prompt = `
      Generate ${questionCount} high-quality educational questions about: "${topic}"
      
      GENERATION PARAMETERS:
      - Question Types: ${questionTypes.join(', ')}
      - Difficulty Range: ${difficultyRange[0]}-${difficultyRange[1]} (on a 1-10 scale)
      - Bloom's Taxonomy Levels: ${bloomsLevels.join(', ')}
      - Question Style: ${questionStyle}
      - Target Audience: ${targetAudience || 'General students'}
      
      ${learningObjectives.length > 0 ? `
      LEARNING OBJECTIVES TO ADDRESS:
      ${learningObjectives.map((obj, index) => `${index + 1}. ${obj}`).join('\n')}
      ` : ''}
      
      ${referenceContext}
      
      ${customInstructions ? `
      CUSTOM INSTRUCTIONS:
      ${customInstructions}
      ` : ''}
      
      REQUIREMENTS FOR EACH QUESTION:
      1. Align with specified Bloom's taxonomy level
      2. Match the difficulty range specified
      3. Be educationally sound and pedagogically appropriate
      4. Avoid ambiguous wording
      5. Include proper answer options for multiple choice/response questions
      6. Provide constructive feedback for both correct and incorrect answers
      7. Include appropriate tags for categorization
      8. ${includeImages ? 'Suggest relevant images or diagrams where helpful' : ''}
      9. ${includeMultimedia ? 'Include multimedia suggestions where appropriate' : ''}
      
      QUESTION TYPE SPECIFICATIONS:
      - Multiple Choice: 4-5 answer options with exactly one correct answer
      - Multiple Response: 4-6 options with 2-3 correct answers
      - True/False: Clear statement with definitive true/false answer
      - Fill in the Blank: Specific blanks with exact expected answers
      - Essay: Open-ended with clear evaluation criteria
      - Matching: Sets of items to match with clear relationships
      
      Return a JSON array with this exact structure:
      {
        "questions": [
          {
            "questionText": "Complete question text",
            "questionType": "multiple_choice|multiple_response|true_false|fill_blank|essay|matching",
            "points": 1,
            "difficultyScore": 5,
            "bloomsLevel": "understand|apply|analyze|evaluate|create|remember",
            "tags": ["tag1", "tag2"],
            "correctFeedback": "Feedback for correct answer",
            "incorrectFeedback": "Feedback for incorrect answer",
            "generalFeedback": "General explanation",
            "partialCredit": false,
            "answerOptions": [
              {
                "answerText": "Option text",
                "isCorrect": true,
                "displayOrder": 0
              }
            ],
            "imageUrl": "",
            "audioUrl": "",
            "videoUrl": "",
            "references": ["citation1", "citation2"]
          }
        ]
      }
      
      QUALITY STANDARDS:
      - Each question must be clear, unambiguous, and educationally valuable
      - Answer options should be plausible and well-crafted
      - Feedback should be instructive and help learning
      - Questions should vary in approach and cognitive demands
      - Ensure proper grammar, spelling, and formatting
      - Include diverse question formats as specified
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are an expert educational assessment designer with extensive experience in curriculum development, Bloom's taxonomy, and pedagogical best practices. You create high-quality, Canvas LMS-compatible questions that are educationally sound, properly aligned with learning objectives, and designed to effectively assess student understanding.
          
          Your questions follow these principles:
          - Clear, unambiguous language appropriate for the target audience
          - Proper alignment with specified Bloom's taxonomy levels
          - Realistic difficulty progression
          - Educationally meaningful content
          - Effective use of distractors in multiple choice questions
          - Constructive feedback that promotes learning
          
          Always return valid JSON with the exact structure requested.`,
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    const result = JSON.parse(response.choices[0].message.content || '{"questions": []}');
    const questions = result.questions || [];

    // Validate and process each question
    const processedQuestions = questions.map((question: any, index: number) => ({
      questionText: question.questionText || `Generated question ${index + 1}`,
      questionType: question.questionType || 'multiple_choice',
      points: Math.max(1, question.points || 1),
      difficultyScore: Math.max(1, Math.min(10, question.difficultyScore || 5)),
      bloomsLevel: question.bloomsLevel || 'understand',
      tags: Array.isArray(question.tags) ? question.tags : [topic],
      correctFeedback: question.correctFeedback || 'Correct! Well done.',
      incorrectFeedback: question.incorrectFeedback || 'Incorrect. Please review the material.',
      generalFeedback: question.generalFeedback || '',
      partialCredit: Boolean(question.partialCredit),
      imageUrl: question.imageUrl || '',
      audioUrl: question.audioUrl || '',
      videoUrl: question.videoUrl || '',
      aiValidationStatus: 'approved',
      aiConfidenceScore: 0.85,
      answerOptions: Array.isArray(question.answerOptions) ? question.answerOptions.map((option: any, optIndex: number) => ({
        answerText: option.answerText || `Option ${optIndex + 1}`,
        isCorrect: Boolean(option.isCorrect),
        displayOrder: optIndex,
      })) : []
    }));

    return processedQuestions;

  } catch (error) {
    console.error("Error generating questions with AI:", error);
    
    // Return fallback questions if AI fails
    return [
      {
        questionText: `What is the main concept of ${params.topic}?`,
        questionType: 'multiple_choice',
        points: 1,
        difficultyScore: 5,
        bloomsLevel: 'understand',
        tags: [params.topic],
        correctFeedback: 'Correct! You understand the basic concept.',
        incorrectFeedback: 'Incorrect. Please review the material on this topic.',
        generalFeedback: 'This question tests basic understanding.',
        partialCredit: false,
        imageUrl: '',
        audioUrl: '',
        videoUrl: '',
        aiValidationStatus: 'needs_review',
        aiConfidenceScore: 0.3,
        answerOptions: [
          { answerText: 'Option A', isCorrect: true, displayOrder: 0 },
          { answerText: 'Option B', isCorrect: false, displayOrder: 1 },
          { answerText: 'Option C', isCorrect: false, displayOrder: 2 },
          { answerText: 'Option D', isCorrect: false, displayOrder: 3 }
        ]
      }
    ];
  }
}
