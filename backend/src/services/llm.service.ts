import { GoogleGenerativeAI, GenerativeModel, Part } from '@google/generative-ai';

function getMimeType(filePath: string): string {
  const ext = filePath.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'pdf': return 'application/pdf';
    case 'png': return 'image/png';
    case 'jpg':
    case 'jpeg': return 'image/jpeg';
    case 'txt':
    case 'md':
    case 'csv': return 'text/plain';
    default: return 'application/octet-stream';
  }
}

export class LLMService {
  private genAI: GoogleGenerativeAI;
  private model: GenerativeModel;

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not provided.");
    }
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-3.1-flash-lite-preview' });
  }

  async getMediaParts(mediaPaths: string[], bucket?: R2Bucket): Promise<Part[]> {
    const parts: Part[] = [];
    if (!mediaPaths || mediaPaths.length === 0) return parts;
    if (!bucket) throw new Error("Bucket is required when mediaPaths are provided.");

    for (const p of mediaPaths) {
      // Remove leading slash if any
      const key = p.startsWith('/') ? p.slice(1) : p;
      const object = await bucket.get(key);
      if (!object) {
        console.warn(`File not found in R2: ${key}`);
        continue;
      }
      const arrayBuffer = await object.arrayBuffer();
      const base64Data = Buffer.from(arrayBuffer).toString('base64');
      const mimeType = getMimeType(key);
      
      parts.push({
        inlineData: {
          data: base64Data,
          mimeType: mimeType
        }
      });
    }
    return parts;
  }

  async generateJsonContent(prompt: string, mediaPaths: string[] = [], bucket?: R2Bucket): Promise<string> {
    const parts: Part[] = [{ text: prompt }];
    const mediaParts = await this.getMediaParts(mediaPaths, bucket);
    parts.push(...mediaParts);

    const result = await this.model.generateContent({
      contents: [{ role: 'user', parts }],
      generationConfig: {
        responseMimeType: "application/json",
      }
    });

    const response = await result.response;
    return response.text();
  }

  async generateContent(prompt: string, mediaPaths: string[] = [], bucket?: R2Bucket): Promise<string> {
    const parts: Part[] = [{ text: prompt }];
    const mediaParts = await this.getMediaParts(mediaPaths, bucket);
    parts.push(...mediaParts);

    const result = await this.model.generateContent({
      contents: [{ role: 'user', parts }]
    });

    const response = await result.response;
    return response.text();
  }
}
