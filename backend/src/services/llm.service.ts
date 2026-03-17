import { GoogleGenerativeAI, GenerativeModel, Part } from '@google/generative-ai';
import { GoogleAIFileManager } from '@google/generative-ai/server';
import { llmConfig } from '../config/llm.config';
import * as mime from 'mime-types';
import * as path from 'path';

class LLMService {
  private genAI: GoogleGenerativeAI;
  private model: GenerativeModel;
  private fileManager: GoogleAIFileManager;

  constructor() {
    this.genAI = new GoogleGenerativeAI(llmConfig.geminiApiKey);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-3.1-flash-lite-preview' });
    this.fileManager = new GoogleAIFileManager(llmConfig.geminiApiKey);
  }

  /**
   * Uploads a file to Gemini API and waits for it to be active if it's processing.
   * Supports Video, Audio, and Images.
   */
  async uploadMediaFile(filePath: string): Promise<Part> {
    if (!llmConfig.geminiApiKey) {
      throw new Error("GEMINI_API_KEY is not defined in environment variables.");
    }
    const mimeType = mime.lookup(filePath) || 'application/octet-stream';
    const displayName = path.basename(filePath);

    // Upload the file
    let uploadResponse = await this.fileManager.uploadFile(filePath, {
      mimeType,
      displayName,
    });
    
    // Check state, loop if PROCESSING
    let file = await this.fileManager.getFile(uploadResponse.file.name);
    while (file.state === "PROCESSING") {
      // Sleep for 2 seconds to wait for processing to complete on Google's end
      await new Promise((resolve) => setTimeout(resolve, 2000));
      file = await this.fileManager.getFile(uploadResponse.file.name);
    }

    if (file.state === "FAILED") {
      throw new Error(`File processing failed for ${filePath}.`);
    }

    return {
      fileData: {
        mimeType: file.mimeType,
        fileUri: file.uri
      }
    };
  }

  async generateJsonContent(prompt: string, mediaPaths: string[] = []): Promise<string> {
    if (!llmConfig.geminiApiKey) {
      throw new Error("GEMINI_API_KEY is not defined in environment variables.");
    }

    const parts: Part[] = [{ text: prompt }];

    // Handle media paths
    if (mediaPaths && mediaPaths.length > 0) {
      for (const p of mediaPaths) {
        const mediaPart = await this.uploadMediaFile(p);
        parts.push(mediaPart);
      }
    }

    const result = await this.model.generateContent({
      contents: [{ role: 'user', parts }],
      generationConfig: {
        responseMimeType: "application/json",
      }
    });

    const response = await result.response;
    return response.text();
  }

  async generateContent(prompt: string, mediaPaths: string[] = []): Promise<string> {
    if (!llmConfig.geminiApiKey) {
      throw new Error("GEMINI_API_KEY is not defined in environment variables.");
    }

    const parts: Part[] = [{ text: prompt }];

    if (mediaPaths && mediaPaths.length > 0) {
      for (const p of mediaPaths) {
        const mediaPart = await this.uploadMediaFile(p);
        parts.push(mediaPart);
      }
    }

    const result = await this.model.generateContent({
      contents: [{ role: 'user', parts }]
    });

    const response = await result.response;
    return response.text();
  }
}

export const llmService = new LLMService();
