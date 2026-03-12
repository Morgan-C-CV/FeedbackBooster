import { llmService } from './llm.service';

export interface KeywordPosition {
  keyword: string;
  startIndex: number;
  endIndex: number;
}

export interface FeedbackCategorizationResult {
  level: 'Task-Level' | 'Process-Level' | 'Unknown';
  category?: 'Surface clarity' | 'Method' | 'Strategy' | 'None';
  keywords: string[];
  keywordPositions?: KeywordPosition[];
  reasoning: string;
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

  async categorizeFeedback(text: string, originalContent: string): Promise<FeedbackCategorizationResult> {
    const prompt = `
      You are an expert academic research mentor capable of analyzing feedback given to junior PhD & Masters students.
      Your task is to classify the provided feedback into one of two main levels: "Task-Level" or "Process-Level".
      
      Definitions:
      1. Task-Level (Global/Local): Evaluates "Surface clarity (expression only)". The feedback addresses the quality of the current research argument, contribution, or explanation.
         It involves: Argument clarity, Contribution articulation, Conceptual coherence.
         
      2. Process-Level: Evaluates "Method" or "Strategy".
         - Method: The feedback addresses whether the chosen method, design, or strategy is appropriate or sufficient.
         - Strategy: (framing/positioning/novelty justification) The feedback addresses higher-level positioning, framing, research question choice, or overall research direction.

      For the given feedback text below, return a JSON response strictly matching this structure:
      {
        "level": "Task-Level" | "Process-Level" | "Unknown",
        "category": "Surface clarity" | "Method" | "Strategy" | "None",
        "keywords": ["array", "of", "exact", "keywords", "from", "the", "feedback", "that", "justify", "this", "level"],
        "reasoning": "brief explanation of why this level and category were chosen based on the keywords"
      }

      Feedback text to analyze:
      "${text}"

      Original content:
      "${originalContent}"
    `;

    try {
      const jsonStr = await llmService.generateJsonContent(prompt);
      const result: FeedbackCategorizationResult = JSON.parse(jsonStr);
      
      // Calculate keyword positions in the original feedback text
      if (result.keywords && Array.isArray(result.keywords)) {
        result.keywordPositions = this.findKeywordPositions(text, result.keywords);
      } else {
        result.keywordPositions = [];
      }
      
      return result;
    } catch (error) {
      console.error("Error categorizing feedback:", error);
      throw new Error("Failed to categorize feedback.");
    }
  }
}

export const feedbackService = new FeedbackService();
