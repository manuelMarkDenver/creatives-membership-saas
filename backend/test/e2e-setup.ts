// test/e2e-setup.ts
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load test environment variables
const envPath = path.resolve(__dirname, '../../.env.test');
dotenv.config({ path: envPath });

// Set NODE_ENV to development for Supabase compatibility
process.env.NODE_ENV = 'development';
