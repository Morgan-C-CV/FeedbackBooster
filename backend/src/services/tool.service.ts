import { GoogleGenerativeAI, GenerativeModel, Part, Content, FunctionDeclarationsTool, FunctionCallingMode } from '@google/generative-ai';
import { llmConfig } from '../config/llm.config';
import { readFile, readToolDeclaration, MULTIMODAL_PREFIX } from './tools/read.tool';
import { writeFile, writeToolDeclaration } from './tools/write.tool';
import { modifyFile, modifyToolDeclaration } from './tools/modify.tool';
import { llmService } from './llm.service';

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
   * When read_file encounters a multimodal file (PDF, image, audio, video),
   * it returns a special marker. This method intercepts the marker, uploads
   * the file via Google's File API, and injects it into the conversation
   * so the LLM can understand the file natively.
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

    const MAX_ITERATIONS = 20;

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
      const multimodalParts: Part[] = []; // Extra media parts to inject

      for (const part of functionCalls) {
        const fc = (part as any).functionCall;
        const toolName = fc.name;
        const args = fc.args;

        let toolResult: string;
        let isMultimodal = false;

        try {
          const executor = toolExecutors[toolName];
          if (!executor) {
            toolResult = `Error: Unknown tool "${toolName}"`;
          } else {
            toolResult = executor(args);
          }

          // Check if this is a multimodal file marker
          if (toolResult.startsWith(MULTIMODAL_PREFIX)) {
            isMultimodal = true;
            const absolutePath = toolResult.slice(MULTIMODAL_PREFIX.length);
            const ext = absolutePath.split('.').pop()?.toLowerCase() || '';

            // Upload the file via File API
            toolResult = `[Uploading ${ext.toUpperCase()} file for multimodal analysis: ${args.path}...]`;
            
            if (onToolCall) {
              onToolCall(toolName, args, toolResult);
            }

            const mediaPart = await llmService.uploadMediaFile(absolutePath);
            multimodalParts.push(mediaPart);

            toolResult = `[File "${args.path}" has been uploaded and attached to the conversation. You can now analyze its contents directly.]`;
          }
        } catch (err: any) {
          toolResult = `Error: ${err.message}`;
        }

        // Notify caller UI if callback provided (and not already notified for multimodal)
        if (onToolCall && !isMultimodal) {
          onToolCall(toolName, args, toolResult);
        }

        functionResponseParts.push({
          functionResponse: {
            name: toolName,
            response: { result: toolResult },
          },
        } as any);
      }

      // Feed function results back to the model, with any media parts attached
      history.push({
        role: 'user',
        parts: [...functionResponseParts, ...multimodalParts],
      });
    }

    return '(Reached maximum tool call iterations)';
  }
}

export const toolService = new ToolService();

