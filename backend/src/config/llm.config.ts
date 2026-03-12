import dotenv from 'dotenv';
dotenv.config();

export const llmConfig = {
  geminiApiKey: process.env.GEMINI_API_KEY || '',
};
