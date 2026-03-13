import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import { llmConfig } from '../config/llm.config';

class LLMService {
  private genAI: GoogleGenerativeAI;
  private model: GenerativeModel;

  constructor() {
    this.genAI = new GoogleGenerativeAI(llmConfig.geminiApiKey);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-3-flash-preview' });
  }

  async generateJsonContent(prompt: string): Promise<string> {
    if (!llmConfig.geminiApiKey) {
      throw new Error("GEMINI_API_KEY is not defined in environment variables.");
    }

    const result = await this.model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
      }
    });

    const response = await result.response;
    return response.text();
  }
}

export const llmService = new LLMService();
