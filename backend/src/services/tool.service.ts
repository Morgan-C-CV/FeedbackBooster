import { GoogleGenerativeAI, GenerativeModel, Part, Content, FunctionDeclarationsTool, FunctionCallingMode } from '@google/generative-ai';
import { llmConfig } from '../config/llm.config';
import { readFile, readToolDeclaration } from './tools/read.tool';
import { writeFile, writeToolDeclaration } from './tools/write.tool';
import { modifyFile, modifyToolDeclaration } from './tools/modify.tool';

// Map of tool name → executor function
const toolExecutors: Record<string, (args: any) => string> = {
  read_file: readFile,
  write_file: writeFile,
  modify_file: modifyFile,
};

// All tool declarations for Gemini function calling
const toolDeclarations: FunctionDeclarationsTool = {
  functionDeclarations: [
    readToolDeclaration,
    writeToolDeclaration,
    modifyToolDeclaration,
  ] as any,
};

class ToolService {
  private genAI: GoogleGenerativeAI;
  private model: GenerativeModel;

  constructor() {
    this.genAI = new GoogleGenerativeAI(llmConfig.geminiApiKey);
    this.model = this.genAI.getGenerativeModel({
      model: 'gemini-3.1-flash-lite-preview',
      tools: [toolDeclarations],
      toolConfig: {
        functionCallingConfig: {
          mode: FunctionCallingMode.AUTO,
        },
      },
    });
  }

  /**
   * Runs a prompt with tool access. The LLM can decide to call tools,
   * and results are fed back until a final text response is generated.
   * 
   * @param onToolCall - Optional callback fired each time a tool is invoked, for UI display
   */
  async runWithTools(
    prompt: string,
    onToolCall?: (toolName: string, args: any, result: string) => void,
  ): Promise<string> {
    if (!llmConfig.geminiApiKey) {
      throw new Error("GEMINI_API_KEY is not defined in environment variables.");
    }

    const history: Content[] = [];
    
    // Initial user message
    history.push({
      role: 'user',
      parts: [{ text: prompt }],
    });

    const MAX_ITERATIONS = 10;

    for (let i = 0; i < MAX_ITERATIONS; i++) {
      const result = await this.model.generateContent({
        contents: history,
      });

      const response = result.response;
      const candidate = response.candidates?.[0];

      if (!candidate || !candidate.content) {
        return response.text() || '(No response from model)';
      }

      // Add model's response to history
      history.push(candidate.content);

      // Check if the model wants to call function(s)
      const functionCalls = candidate.content.parts.filter(
        (p: any) => p.functionCall
      );

      if (functionCalls.length === 0) {
        // No function calls — model is done, return its text
        return response.text();
      }

      // Execute each function call and collect responses
      const functionResponseParts: Part[] = [];

      for (const part of functionCalls) {
        const fc = (part as any).functionCall;
        const toolName = fc.name;
        const args = fc.args;

        let toolResult: string;
        try {
          const executor = toolExecutors[toolName];
          if (!executor) {
            toolResult = `Error: Unknown tool "${toolName}"`;
          } else {
            toolResult = executor(args);
          }
        } catch (err: any) {
          toolResult = `Error: ${err.message}`;
        }

        // Notify caller UI if callback provided
        if (onToolCall) {
          onToolCall(toolName, args, toolResult);
        }

        functionResponseParts.push({
          functionResponse: {
            name: toolName,
            response: { result: toolResult },
          },
        } as any);
      }

      // Feed function results back to the model
      history.push({
        role: 'user',
        parts: functionResponseParts,
      });
    }

    return '(Reached maximum tool call iterations)';
  }
}

export const toolService = new ToolService();
