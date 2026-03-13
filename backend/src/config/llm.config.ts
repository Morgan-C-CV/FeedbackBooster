import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const llmConfig = {
  geminiApiKey: process.env.GEMINI_API_KEY || '',
};
