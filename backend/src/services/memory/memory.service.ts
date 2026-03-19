import * as fs from 'fs';
import * as path from 'path';
import { llmService } from '../llm.service';

/**
 * LongTermMemory record for a single conversation
 */
export interface LongTermMemory {
  fileSummary: string;
  fileDiff: string;
  conversationSummary: string;
}

/**
 * LongTermMemo structure for the JSON file
 */
export interface LongTermMemo {
  farMemory: string;
  longTermMemories: LongTermMemory[];
}

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
   * Initializes long-term memory for a project based on its first conversation.
   *
   * @param projectPath - Absolute path to the project directory
   */
  async createLongTermMemory(projectPath: string): Promise<void> {
    const messagesPath = path.join(projectPath, 'messages.json');
    const memoPath = path.join(projectPath, 'long_term_memo.json');

    if (!fs.existsSync(messagesPath)) {
      throw new Error(`messages.json not found in ${projectPath}`);
    }

    const messages = JSON.parse(fs.readFileSync(messagesPath, 'utf-8'));
    if (!messages || messages.length === 0) {
      throw new Error('No conversations found in messages.json');
    }

    // Process the first conversation
    const firstConv = messages[0];
    const filePaths = this.extractFilePaths(firstConv);
    const convText = this.extractConversationText(firstConv);

    let fileSummary = '';
    if (filePaths.length > 0) {
      fileSummary = await this.summarizeDocument(filePaths);
    }

    const conversationSummary = await this.summarizeFeedbackConversation(convText, '');

    const newMemo: LongTermMemo = {
      farMemory: '',
      longTermMemories: [
        {
          fileSummary,
          fileDiff: '',
          conversationSummary,
        },
      ],
    };

    fs.writeFileSync(memoPath, JSON.stringify(newMemo, null, 2), 'utf-8');
  }

  /**
   * Updates long-term memory with the latest conversation from the project.
   *
   * @param projectPath - Absolute path to the project directory
   */
  async updateLongTermMemory(projectPath: string): Promise<void> {
    const messagesPath = path.join(projectPath, 'messages.json');
    const memoPath = path.join(projectPath, 'long_term_memo.json');

    if (!fs.existsSync(messagesPath)) {
      throw new Error(`messages.json not found in ${projectPath}`);
    }

    const messages = JSON.parse(fs.readFileSync(messagesPath, 'utf-8'));
    if (!messages || messages.length === 0) {
      throw new Error('No conversations found in messages.json');
    }

    // Use the latest conversation
    const currentConv = messages[messages.length - 1];
    const previousConv = messages.length > 1 ? messages[messages.length - 2] : null;

    const currentFiles = this.extractFilePaths(currentConv);
    const previousFiles = previousConv ? this.extractFilePaths(previousConv) : [];
    const convText = this.extractConversationText(currentConv);

    // Read existing memo
    let memo: LongTermMemo;
    if (fs.existsSync(memoPath)) {
      memo = JSON.parse(fs.readFileSync(memoPath, 'utf-8'));
    } else {
      // Fallback to create if memo doesn't exist
      await this.createLongTermMemory(projectPath);
      return;
    }

    // File Summary and Diff
    let fileSummary = '';
    let fileDiff = '';
    if (currentFiles.length > 0) {
      fileSummary = await this.summarizeDocument(currentFiles);

      // Check for files in the previous conversation
      if (previousFiles.length > 0) {
        fileDiff = await this.calculateFileDiff(currentFiles, previousFiles);
      }
    }

    // Conversation Summary
    const background = memo.farMemory + '\n' + memo.longTermMemories.map(m => m.conversationSummary).join('\n');
    const conversationSummary = await this.summarizeFeedbackConversation(convText, background);

    // Add new memory
    memo.longTermMemories.push({
      fileSummary,
      fileDiff,
      conversationSummary,
    });

    // Check if compression is needed: > 5 memories or > 40K tokens (approx 160K chars)
    const totalContent = JSON.stringify(memo);
    const TOKEN_LIMIT_CHARS = 40000 * 4; // 40K tokens * 4 chars/token

    if (memo.longTermMemories.length > 5 || totalContent.length > TOKEN_LIMIT_CHARS) {
      // Compress the first 3 long-term memories
      const toCompress = memo.longTermMemories.splice(0, 3);
      const toCompressText = toCompress
        .map(m => `File Summary: ${m.fileSummary}\nFile Diff: ${m.fileDiff}\nConv Summary: ${m.conversationSummary}`)
        .join('\n\n');

      memo.farMemory = await this.compressMemory(memo.farMemory, toCompressText);
    }

    fs.writeFileSync(memoPath, JSON.stringify(memo, null, 2), 'utf-8');
  }

  /**
   * Extracts file paths from a conversation object.
   */
  private extractFilePaths(conversation: any): string[] {
    const filePaths: string[] = [];
    if (conversation.records) {
      for (const record of conversation.records) {
        if (record.type === 'file' && record.content) {
          filePaths.push(record.content);
        }
      }
    }
    return filePaths;
  }

  /**
   * Extracts text from messages in a conversation object.
   */
  private extractConversationText(conversation: any): string {
    let text = '';
    if (conversation.records) {
      for (const record of conversation.records) {
        if (record.type === 'message' && record.content) {
          const senderName = conversation.participants?.[record.sender] || record.sender;
          text += `${senderName}: ${record.content}\n`;
        }
      }
    }
    return text.trim();
  }

  /**
   * Calculates difference between two sets of files using LLM.
   */
  private async calculateFileDiff(currentFiles: string[], previousFiles: string[]): Promise<string> {
    // Find files that are the "same" (e.g. same filename)
    const pairs: [string, string][] = [];
    for (const curr of currentFiles) {
      const currName = path.basename(curr);
      for (const prev of previousFiles) {
        if (path.basename(prev) === currName) {
          pairs.push([prev, curr]);
          break;
        }
      }
    }

    if (pairs.length === 0) return '';

    // For each pair, ask LLM to summarize the difference
    let diffSummary = '';
    for (const [prev, curr] of pairs) {
      const prompt = `
You are an expert academic research assistant.
Compare the following two versions of the same document and summarize the key changes, improvements, or additions in the new version.

Previous version: ${path.basename(prev)}
New version: ${path.basename(curr)}

Be specific about what content was updated or added.
      `.trim();

      try {
        const diff = await llmService.generateContent(prompt, [prev, curr]);
        diffSummary += `Differences in ${path.basename(curr)}:\n${diff}\n\n`;
      } catch (error) {
        console.error('Error calculating file diff:', error);
      }
    }

    return diffSummary.trim();
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
