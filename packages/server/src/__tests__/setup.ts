// Test setup — load environment variables for tests
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Ensure NODE_ENV is test
process.env.NODE_ENV = 'test';
