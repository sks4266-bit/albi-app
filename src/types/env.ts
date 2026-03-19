// Cloudflare Workers Environment
export interface Env {
  // Database
  DB: D1Database;
  
  // KV Storage (optional)
  KV?: KVNamespace;
  
  // R2 Storage (optional)
  R2?: R2Bucket;
  
  // API Keys
  TOSS_SECRET_KEY?: string;
  TOSS_CLIENT_KEY?: string;
  RESEND_API_KEY?: string;
  
  // Environment
  ENVIRONMENT?: string;
}
