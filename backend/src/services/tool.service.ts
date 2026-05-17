import { GoogleGenerativeAI, GenerativeModel, Part, Content, FunctionDeclarationsTool, FunctionCallingMode } from '@google/generative-ai';

// Tool Declarations
export const readToolDeclaration = {
  name: 'read_file',
  description: 'Reads the content of a file from the Cloudflare R2 bucket.',
  parameters: {
    type: 'object' as any,
    properties: {
      path: {
        type: 'string' as any,
        description: 'Path to the file relative to the bucket root (e.g., projects/project01/file.txt)'
      }
    },
    required: ['path']
  }
};

export const writeToolDeclaration = {
  name: 'write_file',
  description: 'Writes content to a file in the Cloudflare R2 bucket. Creates file if it does not exist.',
  parameters: {
    type: 'object' as any,
    properties: {
      path: {
        type: 'string' as any,
        description: 'Path to the file to write (e.g., projects/project01/new_file.txt)'
      },
      content: {
        type: 'string' as any,
        description: 'The content to write to the file'
      }
    },
    required: ['path', 'content']
  }
};

export const toolDeclarations: FunctionDeclarationsTool = {
  functionDeclarations: [
    readToolDeclaration,
    writeToolDeclaration,
  ] as any,
};

export class ToolService {
  private genAI: GoogleGenerativeAI;
  private model: GenerativeModel;

  constructor(apiKey: string) {
    if (!apiKey) throw new Error("GEMINI_API_KEY is not defined.");
    this.genAI = new GoogleGenerativeAI(apiKey);
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

  private async readFile(args: { path: string }, bucket: R2Bucket): Promise<string> {
    const key = args.path.startsWith('/') ? args.path.slice(1) : args.path;
    const object = await bucket.get(key);
    if (!object) return `Error: File not found: ${key}`;
    return await object.text();
  }

  private async writeFile(args: { path: string, content: string }, bucket: R2Bucket): Promise<string> {
    const key = args.path.startsWith('/') ? args.path.slice(1) : args.path;
    await bucket.put(key, args.content);
    return `Success: Wrote to ${key}`;
  }

  async runWithTools(
    prompt: string,
    bucket: R2Bucket,
    onToolCall?: (toolName: string, args: any, result: string) => void,
  ): Promise<string> {
    const history: Content[] = [];
    history.push({ role: 'user', parts: [{ text: prompt }] });

    const MAX_ITERATIONS = 20;

    for (let i = 0; i < MAX_ITERATIONS; i++) {
      const result = await this.model.generateContent({ contents: history });
      const response = result.response;
      const candidate = response.candidates?.[0];

      if (!candidate || !candidate.content) {
        return response.text() || '(No response from model)';
      }

      history.push(candidate.content);
      const functionCalls = candidate.content.parts.filter((p: any) => p.functionCall);

      if (functionCalls.length === 0) {
        return response.text();
      }

      const functionResponseParts: Part[] = [];

      for (const part of functionCalls) {
        const fc = (part as any).functionCall;
        const toolName = fc.name;
        const args = fc.args;

        let toolResult: string;

        try {
          if (toolName === 'read_file') {
            toolResult = await this.readFile(args, bucket);
          } else if (toolName === 'write_file') {
            toolResult = await this.writeFile(args, bucket);
          } else {
            toolResult = `Error: Unknown tool "${toolName}"`;
          }
        } catch (err: any) {
          toolResult = `Error: ${err.message}`;
        }

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

      history.push({
        role: 'user',
        parts: functionResponseParts,
      });
    }

    return '(Reached maximum tool call iterations)';
  }
}
