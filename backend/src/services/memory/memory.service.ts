import { llmService } from '../llm.service';

/**
 * MemoryService provides LLM-powered functions for:
 * 1. Summarizing uploaded documents (PDF, images, etc.)
 * 2. Summarizing feedback-focused conversations with background context
 * 3. Compressing short-term memory by merging old memory with new content
 */
class MemoryService {

  /**
   * Uploads one or more files (PDF, image, etc.) to the LLM and returns
   * a comprehensive summary of the document content.
   *
   * @param filePaths - Array of absolute paths to the files to summarize
   * @returns The summary text produced by the LLM
   */
  async summarizeDocument(filePaths: string[]): Promise<string> {
    if (!filePaths || filePaths.length === 0) {
      throw new Error('At least one file path must be provided.');
    }

    const prompt = `
You are an expert academic research assistant.
You have been given one or more documents (which may be PDFs, images, or other files).

Please provide a comprehensive and well-structured summary of the document content. Your summary should:
1. Capture the main topics, arguments, and conclusions.
2. Highlight key findings, data points, and methodological details.
3. Note any important figures, tables, or visual information.
4. Preserve the logical structure of the original document(s).

Be thorough but concise — aim for an information-dense summary that retains all essential details.
    `.trim();

    try {
      const summary = await llmService.generateContent(prompt, filePaths);
      return summary;
    } catch (error) {
      console.error('Error summarizing document:', error);
      throw new Error('Failed to summarize document.');
    }
  }

  /**
   * Summarizes a new conversation segment together with background context,
   * with a specific focus on mentor/supervisor feedback.
   *
   * @param conversation - The new conversation content to summarize
   * @param backgroundText - Background context (e.g., prior summaries, paper content)
   * @returns A feedback-focused summary of the conversation
   */
  async summarizeFeedbackConversation(
    conversation: string,
    backgroundText: string
  ): Promise<string> {
    if (!conversation) {
      throw new Error('Conversation content must be provided.');
    }

    const prompt = `
You are an expert academic research mentor assistant.
You are given a conversation between a student and their mentor/supervisor, along with background context.

Your task is to summarize this conversation with a **specific focus on the mentor's feedback**. Your summary should:
1. Extract and highlight all feedback points made by the mentor/supervisor.
2. Identify key suggestions, recommendations, and action items.
3. Note areas of concern or criticism raised by the mentor.
4. Capture any decisions made or directions agreed upon.
5. Preserve the priority and urgency of different feedback items.

Do NOT focus on small talk or logistics — concentrate on substantive academic feedback.

Background Context:
"""
${backgroundText}
"""

New Conversation:
"""
${conversation}
"""

Provide a structured, feedback-focused summary:
    `.trim();

    try {
      const summary = await llmService.generateContent(prompt);
      return summary;
    } catch (error) {
      console.error('Error summarizing feedback conversation:', error);
      throw new Error('Failed to summarize feedback conversation.');
    }
  }

  /**
   * Compresses short-term memory by merging existing accumulated memory
   * with newly added content into a concise, information-dense summary.
   *
   * @param existingMemory - The current accumulated memory text
   * @param newContent - The newly added content to incorporate
   * @returns The compressed and merged memory text
   */
  async compressMemory(
    existingMemory: string,
    newContent: string
  ): Promise<string> {
    if (!existingMemory && !newContent) {
      throw new Error('At least one of existingMemory or newContent must be provided.');
    }

    const prompt = `
You are a memory compression assistant for an academic research mentoring system.
You are given an existing memory (accumulated summaries from previous interactions) and newly added content.

Your task is to merge and compress both into a single, concise yet information-dense summary. Follow these rules:
1. **Preserve key facts**: Important research decisions, mentor feedback, action items, and deadlines must be retained.
2. **Remove redundancy**: If the new content repeats or updates information already in the existing memory, keep only the latest version.
3. **Maintain chronological awareness**: Note when things changed or evolved, but avoid verbose timelines.
4. **Prioritize actionable items**: Unresolved action items and pending decisions should be prominently included.
5. **Be concise**: The compressed memory should be significantly shorter than the combined input, while losing minimal critical information.

Existing Memory:
"""
${existingMemory || '(No existing memory)'}
"""

New Content:
"""
${newContent || '(No new content)'}
"""

Provide the compressed, merged memory:
    `.trim();

    try {
      const compressed = await llmService.generateContent(prompt);
      return compressed;
    } catch (error) {
      console.error('Error compressing memory:', error);
      throw new Error('Failed to compress memory.');
    }
  }
}

export const memoryService = new MemoryService();
