import { llmService } from './llm.service';

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

class FeedbackService {

  /**
   * Finds the start and end indices of keywords in the provided text.
   * @param text The original feedback text
   * @param keywords The list of keywords extracted by the LLM
   * @returns An array of KeywordPosition objects
   */
  public findKeywordPositions(text: string, keywords: string[]): KeywordPosition[] {
    const positions: KeywordPosition[] = [];
    const textLower = text.toLowerCase();

    for (const keyword of keywords) {
      if (!keyword) continue;

      const keywordLower = keyword.toLowerCase();
      let startIndex = textLower.indexOf(keywordLower);

      while (startIndex !== -1) {
        positions.push({
          keyword,
          startIndex,
          endIndex: startIndex + keyword.length
        });
        startIndex = textLower.indexOf(keywordLower, startIndex + keyword.length);
      }
    }

    return positions;
  }

  async extractKeywords(text: string, originalContent: string): Promise<KeywordExtractionResult> {
    const prompt = `
      You are an expert academic research mentor analyzing feedback given to junior PhD & Masters students.
      Your EXTRACT ONLY task is strictly to pull out keywords or key phrases from the provided feedback that could relate to evaluation.
      
      CRITICAL INSTRUCTION: You MUST NOT make any judgment or categorization about whether the feedback is Task-Level or Process-Level. Only output the exact keywords or phrases that humans can use to make this judgment themselves.
      
      Look for terms in the feedback relating to:
      1. Task-Level aspects: "Surface clarity", Argument clarity, Contribution articulation, Conceptual coherence.
      2. Process-Level aspects: "Method", "Strategy", framing, positioning, novelty justification, research question choice, overall research direction.

      Return a JSON response strictly matching this structure with NO other commentary or judgments:
      {
        "keywords": ["array", "of", "exact", "extracted", "keywords", "from", "the", "feedback"]
      }

      Feedback text on Original Content to analyze:
      "${text}"

      Original content:
      "${originalContent}"
    `;

    try {
      const jsonStr = await llmService.generateJsonContent(prompt);
      const result: KeywordExtractionResult = JSON.parse(jsonStr);

      // Calculate keyword positions in the original feedback text
      if (result.keywords && Array.isArray(result.keywords)) {
        result.keywordPositions = this.findKeywordPositions(text, result.keywords);
      } else {
        result.keywordPositions = [];
      }

      return result;
    } catch (error) {
      console.error("Error extracting keywords:", error);
      throw new Error("Failed to extract keywords.");
    }
  }

  /**
   * Generates two mutually exclusive interpretations for a piece of feedback:
   * one exploring why it might be Task-Level, and one exploring why it might be Process-Level.
   * @param text The original feedback text
   * @param originalContent The original paper content that the feedback refers to
   * @returns Detailed Task-level and Process-level interpretations
   */
  async generateDualInterpretations(text: string, originalContent: string): Promise<DualInterpretationResult> {
    const prompt = `
      You are an expert academic research mentor capable of deeply analyzing feedback given to junior PhD & Masters students.
      Your task is to provide TWO mutually exclusive, well-reasoned interpretations for the following feedback.
      
      Interpret the feedback ONCE as if it is definitively "Task-Level" feedback, and ONCE as if it is definitively "Process-Level" feedback, regardless of which you personally think is more likely.

      Definitions:
      1. Task-Level (Global/Local): The feedback addresses the quality of the current research argument, contribution, or explanation (Surface clarity). It involves Argument clarity, Contribution articulation, Conceptual coherence.
      2. Process-Level: The feedback addresses higher-level positioning, framing, research question choice, overall research direction, or whether the chosen method design is appropriate (Method / Strategy).
      
      For the given feedback text below, return a JSON response strictly matching this structure:
      {
        "taskLevelInterpretation": {
           "reasoning": "Explain in detail why this feedback could be interpreted purely as a Task-Level issue based on the surface clarity or argument expression.",
           "keywords": ["array", "of", "exact", "keywords", "from", "the", "feedback", "supporting", "Task-Level"]
        },
        "processLevelInterpretation": {
           "reasoning": "Explain in detail why this feedback could be interpreted purely as a Process-Level issue based on underlying methodology, strategy, or positioning.",
           "keywords": ["array", "of", "exact", "keywords", "from", "the", "feedback", "supporting", "Process-Level"]
        }
      }

      Feedback text on Original Content to analyze:
      "${text}"

      Original content:
      "${originalContent}"
    `;

    try {
      const jsonStr = await llmService.generateJsonContent(prompt);
      const result: DualInterpretationResult = JSON.parse(jsonStr);

      if (result.taskLevelInterpretation.keywords && Array.isArray(result.taskLevelInterpretation.keywords)) {
        result.taskLevelInterpretation.keywordPositions = this.findKeywordPositions(text, result.taskLevelInterpretation.keywords);
      } else {
        result.taskLevelInterpretation.keywordPositions = [];
      }

      if (result.processLevelInterpretation.keywords && Array.isArray(result.processLevelInterpretation.keywords)) {
        result.processLevelInterpretation.keywordPositions = this.findKeywordPositions(text, result.processLevelInterpretation.keywords);
      } else {
        result.processLevelInterpretation.keywordPositions = [];
      }

      return result;
    } catch (error) {
      console.error("Error generating dual interpretations:", error);
      throw new Error("Failed to generate dual interpretations.");
    }
  }
}

export const feedbackService = new FeedbackService();
