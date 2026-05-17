import { LLMService } from '../llm.service';

export interface LongTermMemory {
  fileSummary: string;
  fileDiff: string;
  conversationSummary: string;
}

export interface LongTermMemo {
  farMemory: string;
  longTermMemories: LongTermMemory[];
}

export class MemoryService {
  private llmService: LLMService;

  constructor(apiKey: string) {
    this.llmService = new LLMService(apiKey);
  }

  async summarizeDocument(filePaths: string[], bucket: R2Bucket): Promise<string> {
    if (!filePaths || filePaths.length === 0) {
      throw new Error('At least one file path must be provided.');
    }
    const prompt = `You are an expert academic research assistant.
You have been given one or more documents (which may be PDFs, images, or other files).
Please provide a comprehensive and well-structured summary of the document content. Your summary should:
1. Capture the main topics, arguments, and conclusions.
2. Highlight key findings, data points, and methodological details.
3. Note any important figures, tables, or visual information.
4. Preserve the logical structure of the original document(s).
Be thorough but concise.`;
    return await this.llmService.generateContent(prompt, filePaths, bucket);
  }

  async summarizeFeedbackConversation(conversation: string, backgroundText: string, bucket: R2Bucket): Promise<string> {
    if (!conversation) throw new Error('Conversation content must be provided.');
    const prompt = `You are an expert academic research mentor assistant.
You are given a conversation between a student and their mentor/supervisor, along with background context.
Your task is to summarize this conversation with a specific focus on the mentor's feedback. Your summary should:
1. Extract and highlight all feedback points.
2. Identify key suggestions and recommendations.
3. Note areas of concern or criticism.
4. Capture any decisions made.
Background Context:
"""
${backgroundText}
"""
New Conversation:
"""
${conversation}
"""
Provide a structured, feedback-focused summary:`;
    return await this.llmService.generateContent(prompt, [], bucket);
  }

  async createLongTermMemory(projectId: string, bucket: R2Bucket): Promise<void> {
    const messagesKey = `projects/${projectId}/messages.json`;
    const memoKey = `projects/${projectId}/long_term_memo.json`;

    const messagesObj = await bucket.get(messagesKey);
    if (!messagesObj) throw new Error(`messages.json not found in ${projectId}`);
    const messages = await messagesObj.json() as any[];
    if (!messages || messages.length === 0) throw new Error('No conversations found in messages.json');

    const firstConv = messages[0];
    const filePaths = this.extractFilePaths(firstConv);
    const convText = this.extractConversationText(firstConv);

    let fileSummary = '';
    if (filePaths.length > 0) {
      fileSummary = await this.summarizeDocument(filePaths, bucket);
    }
    const conversationSummary = await this.summarizeFeedbackConversation(convText, '', bucket);

    const newMemo: LongTermMemo = {
      farMemory: '',
      longTermMemories: [{ fileSummary, fileDiff: '', conversationSummary }],
    };

    await bucket.put(memoKey, JSON.stringify(newMemo, null, 2));
  }

  async updateLongTermMemory(projectId: string, bucket: R2Bucket): Promise<void> {
    const messagesKey = `projects/${projectId}/messages.json`;
    const memoKey = `projects/${projectId}/long_term_memo.json`;

    const messagesObj = await bucket.get(messagesKey);
    if (!messagesObj) throw new Error(`messages.json not found in ${projectId}`);
    const messages = await messagesObj.json() as any[];
    if (!messages || messages.length === 0) throw new Error('No conversations found');

    const currentConv = messages[messages.length - 1];
    const previousConv = messages.length > 1 ? messages[messages.length - 2] : null;

    const currentFiles = this.extractFilePaths(currentConv);
    const previousFiles = previousConv ? this.extractFilePaths(previousConv) : [];
    const convText = this.extractConversationText(currentConv);

    let memo: LongTermMemo;
    const memoObj = await bucket.get(memoKey);
    if (memoObj) {
      memo = await memoObj.json() as LongTermMemo;
    } else {
      await this.createLongTermMemory(projectId, bucket);
      return;
    }

    let fileSummary = '';
    let fileDiff = '';
    if (currentFiles.length > 0) {
      fileSummary = await this.summarizeDocument(currentFiles, bucket);
      if (previousFiles.length > 0) {
        fileDiff = await this.calculateFileDiff(currentFiles, previousFiles, bucket);
      }
    }

    const background = memo.farMemory + '\n' + memo.longTermMemories.map(m => m.conversationSummary).join('\n');
    const conversationSummary = await this.summarizeFeedbackConversation(convText, background, bucket);

    memo.longTermMemories.push({ fileSummary, fileDiff, conversationSummary });

    const totalContent = JSON.stringify(memo);
    const TOKEN_LIMIT_CHARS = 40000 * 4;
    if (memo.longTermMemories.length > 5 || totalContent.length > TOKEN_LIMIT_CHARS) {
      const toCompress = memo.longTermMemories.splice(0, 3);
      const toCompressText = toCompress.map(m => `File Summary: ${m.fileSummary}\nFile Diff: ${m.fileDiff}\nConv Summary: ${m.conversationSummary}`).join('\n\n');
      memo.farMemory = await this.compressMemory(memo.farMemory, toCompressText, bucket);
    }

    await bucket.put(memoKey, JSON.stringify(memo, null, 2));
  }

  async createShortTermMemory(projectId: string, bucket: R2Bucket): Promise<string> {
    const memoKey = `projects/${projectId}/long_term_memo.json`;
    const messagesKey = `projects/${projectId}/messages.json`;
    const shortTermKey = `projects/${projectId}/short_term_memo.md`;

    const memoObj = await bucket.get(memoKey);
    if (!memoObj) throw new Error(`long_term_memo.json not found in ${projectId}`);
    const memo = await memoObj.json() as LongTermMemo;

    const messagesObj = await bucket.get(messagesKey);
    if (!messagesObj) throw new Error(`messages.json not found in ${projectId}`);
    const messages = await messagesObj.json() as any[];

    const lastConv = messages[messages.length - 1];
    const prevConv = messages.length > 1 ? messages[messages.length - 2] : null;

    const backgroundPrompt = `You are an expert academic research assistant.
You are given the entire long-term memory of a research project, which includes a "far memory" and several recent "long-term memories".
Your task is to provide a concise yet comprehensive background summary of the project's progress, key decisions, and current status based on this memory.
Long-term Memory:
"""
Far Memory: ${memo.farMemory}
Recent Memories:
${memo.longTermMemories.map((m, i) => `[Memory ${i+1}]
File Summary: ${m.fileSummary}
File Diff: ${m.fileDiff}
Conversation Summary: ${m.conversationSummary}`).join('\n\n')}
"""
Provide a well-structured summary (in Markdown) of the project background:`;

    const backgroundSummary = await this.llmService.generateContent(backgroundPrompt, [], bucket);

    let fileDiff = '';
    const currentFiles = this.extractFilePaths(lastConv);
    const previousFiles = prevConv ? this.extractFilePaths(prevConv) : [];

    if (currentFiles.length > 0 && previousFiles.length > 0) {
      fileDiff = await this.calculateFileDiff(currentFiles, previousFiles, bucket);
    } else if (currentFiles.length > 0) {
      fileDiff = "_No previous files to compare with._";
    } else {
      fileDiff = "_No files were involved in the latest conversation._";
    }

    const lastConversationText = this.extractConversationText(lastConv);

    const markdownContent = `# Short-term Research Memory
## 1. Background Summary
${backgroundSummary}
## 2. File Differences
${fileDiff || '_No significant file differences detected._'}
## 3. Latest Conversation Record
\`\`\`text
${lastConversationText || '(No conversation records found)'}
\`\`\`
`;

    await bucket.put(shortTermKey, markdownContent);
    return markdownContent;
  }

  private extractFilePaths(conversation: any): string[] {
    const filePaths: string[] = [];
    if (conversation.records) {
      for (const record of conversation.records) {
        if (record.type === 'file' && record.content) {
          // Normalize the path so it works with R2 (must not have leading slash or be absolute local path)
          // Just use the basename and prepend projects/projectID/ if necessary?
          // Since the frontend stores 'projects/project01/file.pdf', we use it as is.
          let p = record.content as string;
          if (p.includes('/projects/')) {
             p = p.substring(p.indexOf('projects/'));
          } else if (p.startsWith('/')) {
             p = p.substring(1);
          }
          filePaths.push(p);
        }
      }
    }
    return filePaths;
  }

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

  private getBaseName(p: string): string {
    return p.split('/').pop() || p;
  }
  
  private getExt(p: string): string {
    return p.split('.').pop() || '';
  }

  private async calculateFileDiff(currentFiles: string[], previousFiles: string[], bucket: R2Bucket): Promise<string> {
    const pairs: [string, string][] = [];
    const unmatchedCurrent = [...currentFiles];
    const unmatchedPrevious = [...previousFiles];

    for (let i = unmatchedCurrent.length - 1; i >= 0; i--) {
      const currName = this.getBaseName(unmatchedCurrent[i]);
      const prevIdx = unmatchedPrevious.findIndex(p => this.getBaseName(p) === currName);
      if (prevIdx !== -1) {
        pairs.push([unmatchedPrevious[prevIdx], unmatchedCurrent[i]]);
        unmatchedCurrent.splice(i, 1);
        unmatchedPrevious.splice(prevIdx, 1);
      }
    }

    if (unmatchedCurrent.length > 0 && unmatchedPrevious.length > 0) {
      for (let i = unmatchedCurrent.length - 1; i >= 0; i--) {
        const ext = this.getExt(unmatchedCurrent[i]);
        const prevIdx = unmatchedPrevious.findIndex(p => this.getExt(p) === ext);
        if (prevIdx !== -1) {
          pairs.push([unmatchedPrevious[prevIdx], unmatchedCurrent[i]]);
          unmatchedCurrent.splice(i, 1);
          unmatchedPrevious.splice(prevIdx, 1);
        }
      }
    }

    if (pairs.length === 0) return '';

    let diffSummary = '';
    for (const [prev, curr] of pairs) {
      const prompt = `You are an expert academic research assistant.
Compare the following two versions of the same document and summarize the key changes, improvements, or additions in the new version.
Previous version: ${this.getBaseName(prev)}
New version: ${this.getBaseName(curr)}
Based on the provided documents, provide a clear, structured summary of what has changed.`;

      try {
        const summary = await this.llmService.generateContent(prompt, [prev, curr], bucket);
        diffSummary += `### Differences in ${this.getBaseName(curr)}:\n${summary}\n\n`;
      } catch (error) {
        console.error('Error calculating file diff with LLM:', error);
      }
    }
    return diffSummary.trim();
  }

  async compressMemory(existingMemory: string, newContent: string, bucket: R2Bucket): Promise<string> {
    if (!existingMemory && !newContent) throw new Error('Existing memory or new content must be provided.');
    const prompt = `You are a memory compression assistant. Merge and compress the following into a single information-dense summary.
Existing Memory:
"""
${existingMemory || '(No existing memory)'}
"""
New Content:
"""
${newContent || '(No new content)'}
"""
Provide the compressed, merged memory:`;
    return await this.llmService.generateContent(prompt, [], bucket);
  }
}
