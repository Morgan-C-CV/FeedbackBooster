import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';
import chalk from 'chalk';
const { Select, Input } = require('enquirer');

import { memoryService } from '../services/memory/memory.service';
import { feedbackService } from '../services/feedback.service';
import { toolService } from '../services/tool.service';

// ─── Display Helpers (from interactive-cli.ts) ──────────────────────────────

function highlightKeywords(text: string, positions: { startIndex: number; endIndex: number }[]) {
  const sortedPositions = [...positions].sort((a, b) => a.startIndex - b.startIndex);

  let highlightedText = '';
  let currentIndex = 0;

  for (const pos of sortedPositions) {
    if (pos.startIndex >= currentIndex) {
      highlightedText += text.substring(currentIndex, pos.startIndex);
      highlightedText += chalk.bgYellow.black(text.substring(pos.startIndex, pos.endIndex));
      currentIndex = pos.endIndex;
    }
  }
  highlightedText += text.substring(currentIndex);

  return highlightedText;
}

function highlightReasoning(text: string, supportedPhrases: string[], unsupportedPhrases: string[]) {
  let highlightedText = text;

  const allPhrases = [
    ...supportedPhrases.map(p => ({ text: p, supported: true })),
    ...unsupportedPhrases.map(p => ({ text: p, supported: false }))
  ];

  allPhrases.sort((a, b) => b.text.length - a.text.length);

  for (const phrase of allPhrases) {
    if (!phrase.text) continue;
    const parts = highlightedText.split(phrase.text);
    const highlightedPhrase = phrase.supported
      ? chalk.bgGreen.black(phrase.text)
      : chalk.red(phrase.text);
    highlightedText = parts.join(highlightedPhrase);
  }

  return highlightedText;
}

// ─── Utility ────────────────────────────────────────────────────────────────

async function waitForKeyPress(query: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) => {
    rl.question(query, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

/**
 * Extract advisor feedback messages from a conversation object.
 * Returns concatenated feedback from the Advisor (sender "A").
 */
function extractAdvisorFeedback(conversation: any): string {
  const feedbackMessages: string[] = [];
  if (conversation.records) {
    for (const record of conversation.records) {
      if (record.type === 'message' && record.sender === 'A' && record.content) {
        feedbackMessages.push(record.content);
      }
    }
  }
  return feedbackMessages.join('\n\n');
}

/**
 * Extract file paths from a conversation object.
 */
function extractFilePaths(conversation: any): string[] {
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
 * Extract the full conversation text for display purposes.
 */
function extractConversationText(conversation: any): string {
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

// ─── Main Agent ─────────────────────────────────────────────────────────────

/**
 * Feedback Agent — Memory-Aware Interactive CLI
 *
 * Flow (per conversation):
 * 1. Process memory (create/update long-term → build short-term).
 * 2. Display short-term memory as context.
 * 3. Use toolService to access referenced files for richer context.
 * 4. Run feedback analysis on the current conversation's advisor feedback:
 *    - Keyword extraction & highlighting
 *    - Dual interpretations (Task-Level vs Process-Level)
 *    - User selection & reasoning input
 *    - Consistency check & highlighting
 * 5. Wait for user to press Enter, then proceed to the next conversation.
 */
export async function runFeedbackAgent(projectPath: string) {
  const messagesPath = path.join(projectPath, 'messages.json');
  const memoPath = path.join(projectPath, 'long_term_memo.json');
  const shortTermPath = path.join(projectPath, 'short_term_memo.md');

  // Backup paths
  const messagesBackupPath = path.join(projectPath, 'messages.json.bak');
  const memoBackupPath = path.join(projectPath, 'long_term_memo.json.bak');
  const shortTermBackupPath = path.join(projectPath, 'short_term_memo.md.bak');

  console.log(chalk.blue.bold('\n=================== Feedback Agent (Memory-Aware) ===================\n'));
  console.log(chalk.gray(`Project Path: ${projectPath}`));

  if (!fs.existsSync(messagesPath)) {
    console.error(chalk.red(`Error: messages.json not found at ${messagesPath}`));
    return;
  }

  // 1. Load full history and backup original files
  const fullHistory = JSON.parse(fs.readFileSync(messagesPath, 'utf-8'));
  fs.copyFileSync(messagesPath, messagesBackupPath);
  if (fs.existsSync(memoPath)) fs.copyFileSync(memoPath, memoBackupPath);
  if (fs.existsSync(shortTermPath)) fs.copyFileSync(shortTermPath, shortTermBackupPath);

  console.log(chalk.gray(`Loaded ${fullHistory.length} conversations.\n`));

  try {
    // 2. Clear current state for fresh processing
    if (fs.existsSync(memoPath)) fs.unlinkSync(memoPath);
    if (fs.existsSync(shortTermPath)) fs.unlinkSync(shortTermPath);

    // ═══════════════════════════════════════════════════════════════════════
    // Main Loop: Process each conversation one-by-one
    // ═══════════════════════════════════════════════════════════════════════
    for (let i = 0; i < fullHistory.length; i++) {
      const currentConversation = fullHistory[i];
      const convId = currentConversation.conversation_id || `#${i + 1}`;

      console.log(chalk.blue.bold(`\n╔══════════════════════════════════════════════════════════════════╗`));
      console.log(chalk.blue.bold(`║  Conversation ${i + 1} / ${fullHistory.length}: ${convId}`));
      console.log(chalk.blue.bold(`╚══════════════════════════════════════════════════════════════════╝\n`));

      // ─── Step A: Memory Processing ──────────────────────────────────────
      console.log(chalk.cyan('  [Memory] Processing...'));

      // Simulate partial messages.json (incremental upload)
      const currentHistory = fullHistory.slice(0, i + 1);
      fs.writeFileSync(messagesPath, JSON.stringify(currentHistory, null, 2), 'utf-8');

      // Create or Update long-term memory
      if (!fs.existsSync(memoPath)) {
        console.log(chalk.gray('    → Creating Long-term Memory (Initial)...'));
        await memoryService.createLongTermMemory(projectPath);
      } else {
        console.log(chalk.gray('    → Updating Long-term Memory...'));
        await memoryService.updateLongTermMemory(projectPath);
      }

      // Build Short-term Memory
      console.log(chalk.gray('    → Building Short-term Memory...'));
      const shortTermMemory = await memoryService.createShortTermMemory(projectPath);
      console.log(chalk.green('    ✓ Memory processed.\n'));

      // Display short-term memory
      console.log(chalk.cyan('  [Context] Short-term Memory:\n'));
      console.log(chalk.gray(shortTermMemory));
      console.log('\n');

      // ─── Step B: Tool-Augmented File Context ────────────────────────────
      const referencedFiles = extractFilePaths(currentConversation);
      let fileContext = '';

      if (referencedFiles.length > 0) {
        console.log(chalk.cyan('  [Tools] Retrieving file context...'));
        const fileList = referencedFiles.map(f => path.basename(f)).join(', ');
        console.log(chalk.gray(`    Files: ${fileList}\n`));

        const filePathsRelative = referencedFiles.map(f => {
          const projectRoot = path.resolve(projectPath, '../..');
          return path.relative(projectRoot, f);
        });

        const toolPrompt = `You are analyzing research project files for context. 
Please read the following files and provide a concise summary of each file's content that would be relevant for understanding academic feedback:

Files to read:
${filePathsRelative.map(f => `- ${f}`).join('\n')}

For each file, use the read_file tool to access it, then provide a brief summary focusing on the research content, methodology, and key arguments.`;

        try {
          fileContext = await toolService.runWithTools(
            toolPrompt,
            (toolName, args, result) => {
              console.log(chalk.yellow(`    🔨 Tool: ${chalk.bold(toolName)}`));
              console.log(chalk.gray(`       Path: ${args.path || '(n/a)'}`));
              const displayResult = result.length > 200
                ? result.substring(0, 200) + `... (${result.length} chars)`
                : result;
              console.log(chalk.gray(`       Result: ${displayResult}\n`));
            }
          );
          console.log(chalk.green('    ✓ File context retrieved.\n'));
        } catch (err: any) {
          console.log(chalk.yellow(`    ⚠ Could not retrieve file context: ${err.message}\n`));
        }
      }

      // ─── Step C: Feedback Analysis ──────────────────────────────────────
      const feedback = extractAdvisorFeedback(currentConversation);
      const conversationText = extractConversationText(currentConversation);

      if (!feedback) {
        console.log(chalk.yellow('  No advisor feedback found in this conversation. Skipping analysis.\n'));
        if (i < fullHistory.length - 1) {
          await waitForKeyPress(chalk.gray('  Press [Enter] to proceed to the next conversation...'));
        }
        continue;
      }

      // Build enriched context: short-term memory + file context
      const enrichedContext = [
        shortTermMemory,
        fileContext ? `\n## File Context\n${fileContext}` : ''
      ].filter(Boolean).join('\n\n');

      // Student's messages as the "original content"
      const studentMessages = currentConversation.records
        ?.filter((r: any) => r.type === 'message' && r.sender === 'B')
        .map((r: any) => r.content)
        .join('\n\n') || conversationText;

      // Display
      console.log(chalk.cyan('  [Analysis] Interactive Feedback Analysis\n'));

      console.log(chalk.gray('  --- Conversation ---\n'));
      console.log(chalk.gray('  ' + conversationText.split('\n').join('\n  ')));
      console.log('\n');

      console.log(chalk.white('  --- Advisor Feedback ---\n'));
      console.log(chalk.bold('  ' + feedback.split('\n').join('\n  ')));
      console.log('\n');

      // Step 1: Keyword Extraction
      console.log(chalk.blue('  Extracting keywords from feedback...'));
      const keywordResult = await feedbackService.extractKeywords(feedback, studentMessages, enrichedContext);

      console.log(chalk.green('  Keywords Extracted:\n'));
      const highlightedFeedback = highlightKeywords(feedback, keywordResult.keywordPositions || []);
      console.log('  ' + highlightedFeedback);
      console.log('\n');

      // Step 2: Dual Interpretations
      console.log(chalk.blue('  Generating Dual Interpretations...'));
      const dualResult = await feedbackService.generateDualInterpretations(feedback, studentMessages, enrichedContext);

      console.log(chalk.bold('  Task-Level Interpretation: ') + dualResult.taskLevelInterpretation.reasoning + '\n');
      console.log(chalk.bold('  Process-Level Interpretation: ') + dualResult.processLevelInterpretation.reasoning + '\n');

      // Step 3: User Selection
      const selectPrompt = new Select({
        name: 'interpretation',
        message: 'Based on the context, which level do you think this feedback belongs to?',
        choices: [
          { name: 'Task-Level', message: 'Task-Level' },
          { name: 'Process-Level', message: 'Process-Level' }
        ]
      });

      const answer = await selectPrompt.run();

      console.log('\n');
      console.log(chalk.cyan(`  You selected: ${answer}`));

      // Step 4: User Reasoning
      const reasonPrompt = new Input({
        message: `Why did you choose ${answer} over the other option? Please provide your reasoning:\n`,
      });

      const userReasoning = await reasonPrompt.run();

      // Step 5: Consistency Check
      console.log('\n' + chalk.blue(`  Checking consistency of your reasoning against the ${answer} context...`));

      const consistencyResult = await feedbackService.checkReasoningConsistency(
        userReasoning,
        answer,
        feedback,
        studentMessages,
        keywordResult.keywords,
        enrichedContext
      );

      console.log(chalk.gray(`  Explanation: ${consistencyResult.explanation}\n`));

      console.log(chalk.bold('  Your Reasoning (Supported parts in GREEN, Unsupported in RED):'));
      const evaluatedReasoning = highlightReasoning(
        userReasoning,
        consistencyResult.supportedText || [],
        consistencyResult.unsupportedText || []
      );
      console.log('  ' + evaluatedReasoning);

      // ─── End of conversation ────────────────────────────────────────────
      if (i < fullHistory.length - 1) {
        console.log(chalk.blue.bold(`\n  ─── Conversation ${i + 1} complete ───\n`));
        await waitForKeyPress(chalk.cyan('  Press [Enter] to proceed to the next conversation...'));
      } else {
        console.log(chalk.green.bold(`\n  ✓ All ${fullHistory.length} conversations processed.\n`));
      }
    }

    console.log(chalk.blue.bold('\n=====================================================================\n'));

  } catch (err) {
    console.error(chalk.red('Error during the process:'), err);
  } finally {
    // Restore backups
    console.log(chalk.gray('\nRestoring original files from backups...'));
    if (fs.existsSync(messagesBackupPath)) {
      fs.copyFileSync(messagesBackupPath, messagesPath);
      fs.unlinkSync(messagesBackupPath);
    }
    if (fs.existsSync(memoBackupPath)) {
      fs.copyFileSync(memoBackupPath, memoPath);
      fs.unlinkSync(memoBackupPath);
    }
    if (fs.existsSync(shortTermBackupPath)) {
      fs.copyFileSync(shortTermBackupPath, shortTermPath);
      fs.unlinkSync(shortTermBackupPath);
    }
    console.log(chalk.gray('Backups restored. Agent finished.'));
  }
}

// ─── CLI Entry Point ────────────────────────────────────────────────────────

const projectPathArg = process.argv[2] || path.resolve(__dirname, '../../projects/project01');
const resolvedProjectPath = path.resolve(projectPathArg);

runFeedbackAgent(resolvedProjectPath).catch(console.error);
