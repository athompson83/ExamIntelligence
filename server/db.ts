import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// OPTIMIZED Connection Pool Configuration
export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  // Performance optimizations
  max: 20, // Maximum number of connections in the pool
  min: 5,  // Minimum number of connections to maintain
  idleTimeoutMillis: 30000, // Close idle connections after 30 seconds
  connectionTimeoutMillis: 10000, // Connection timeout of 10 seconds
  // Prepared statements for better performance
  statement_timeout: 30000, // 30 second statement timeout
  query_timeout: 30000, // 30 second query timeout
  // Enable connection pooling optimizations
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000,
});

// Configure Drizzle with optimized pool
export const db = drizzle({ 
  client: pool, 
  schema,
  logger: process.env.NODE_ENV === 'development', // Enable logging in development only
});