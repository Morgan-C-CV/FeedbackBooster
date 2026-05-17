import { LLMService } from './llm.service';

export interface KeywordPosition {
  keyword: string;
  startIndex: number;
  endIndex: number;
}

export interface KeywordExtractionResult {
  keywords: string[];
  keywordPositions?: KeywordPosition[];
}

export interface DualInterpretationResult {
  taskLevelInterpretation: {
    reasoning: string;
    keywords: string[];
    keywordPositions?: KeywordPosition[];
  };
  processLevelInterpretation: {
    reasoning: string;
    keywords: string[];
    keywordPositions?: KeywordPosition[];
  };
}

export interface ReasoningConsistencyResult {
  isSupported: boolean;
  supportedText: string[];
  unsupportedText: string[];
  explanation: string;
}

export class FeedbackService {
  private llmService: LLMService;

  constructor(apiKey: string) {
    this.llmService = new LLMService(apiKey);
  }

  public findKeywordPositions(text: string, keywords: string[]): KeywordPosition[] {
    const positions: KeywordPosition[] = [];
    const textLower = text.toLowerCase();

    for (const keyword of keywords) {
      if (!keyword) continue;
      const keywordLower = keyword.toLowerCase();
      let startIndex = textLower.indexOf(keywordLower);

      while (startIndex !== -1) {
        positions.push({ keyword, startIndex, endIndex: startIndex + keyword.length });
        startIndex = textLower.indexOf(keywordLower, startIndex + keyword.length);
      }
    }
    return positions;
  }

  async extractKeywords(text: string, originalContent: string, additionalContext?: string): Promise<KeywordExtractionResult> {
    const contextBlock = additionalContext ? `\nAdditional Background Context:\n"""\n${additionalContext}\n"""` : '';
    const prompt = `You are an expert academic research mentor...
(See existing prompt logic)
Feedback text: "${text}"
Original content: "${originalContent}"
${contextBlock}
`;
    // Note: To save tokens, let's keep the original prompt
    const fullPrompt = `You are an expert academic research mentor analyzing feedback given to junior PhD & Masters students.
Your EXTRACT ONLY task is strictly to pull out keywords or key phrases from the provided feedback that could relate to evaluation.
CRITICAL INSTRUCTION: You MUST NOT make any judgment or categorization about whether the feedback is Task-Level or Process-Level.
Look for terms in the feedback relating to:
1. Task-Level aspects: "Surface clarity", Argument clarity, Contribution articulation, Conceptual coherence.
2. Process-Level aspects: "Method", "Strategy", framing, positioning, novelty justification, research question choice.

Return a JSON response strictly matching this structure:
{ "keywords": ["array", "of", "keywords"] }

Feedback text: "${text}"
Original content: "${originalContent}"
${contextBlock}`;

    const jsonStr = await this.llmService.generateJsonContent(fullPrompt);
    const result: KeywordExtractionResult = JSON.parse(jsonStr);
    result.keywordPositions = result.keywords ? this.findKeywordPositions(text, result.keywords) : [];
    return result;
  }

  async generateDualInterpretations(text: string, originalContent: string, additionalContext?: string): Promise<DualInterpretationResult> {
    const contextBlock = additionalContext ? `\nAdditional Context:\n"""\n${additionalContext}\n"""` : '';
    const prompt = `You are an expert academic research mentor.
Provide TWO mutually exclusive, well-reasoned interpretations for the following feedback.
Interpret ONCE as "Task-Level" and ONCE as "Process-Level".
Return JSON:
{
  "taskLevelInterpretation": { "reasoning": "...", "keywords": ["..."] },
  "processLevelInterpretation": { "reasoning": "...", "keywords": ["..."] }
}

Feedback: "${text}"
Original content: "${originalContent}"
${contextBlock}`;

    const jsonStr = await this.llmService.generateJsonContent(prompt);
    const result: DualInterpretationResult = JSON.parse(jsonStr);
    
    if (result.taskLevelInterpretation.keywords) {
      result.taskLevelInterpretation.keywordPositions = this.findKeywordPositions(text, result.taskLevelInterpretation.keywords);
    } else {
      result.taskLevelInterpretation.keywordPositions = [];
    }
    if (result.processLevelInterpretation.keywords) {
      result.processLevelInterpretation.keywordPositions = this.findKeywordPositions(text, result.processLevelInterpretation.keywords);
    } else {
      result.processLevelInterpretation.keywordPositions = [];
    }
    return result;
  }

  async checkReasoningConsistency(
    userReasoning: string,
    selectedInterpretation: string,
    originalFeedback: string,
    originalContent: string,
    extractedKeywords: string[],
    additionalContext?: string
  ): Promise<ReasoningConsistencyResult> {
    const contextBlock = additionalContext ? `\nContext:\n"""\n${additionalContext}\n"""` : '';
    const prompt = `You are an expert academic research mentor evaluating a student's reasoning for classifying feedback.
The student has classified the feedback as "${selectedInterpretation}".
Determine consistency against the provided context. Identify:
1. EXACT phrasing from the student's reasoning that is supported.
2. EXACT phrasing from the student's reasoning that is NOT supported.

Return JSON:
{
  "isSupported": true | false,
  "supportedText": ["phrases"],
  "unsupportedText": ["phrases"],
  "explanation": "..."
}

Student's Reasoning: "${userReasoning}"
Original Feedback: "${originalFeedback}"
Keywords: ${JSON.stringify(extractedKeywords)}
Original Content: "${originalContent}"
${contextBlock}`;

    const jsonStr = await this.llmService.generateJsonContent(prompt);
    const cleanJson = jsonStr.replace(/```json\n?|\n?```/g, '').trim();
    const result: ReasoningConsistencyResult = JSON.parse(cleanJson);
    if (!result.supportedText) result.supportedText = [];
    if (!result.unsupportedText) result.unsupportedText = [];
    return result;
  }
}
