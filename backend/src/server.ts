import express from 'express';
import cors from 'cors';
import * as fs from 'fs';
import * as path from 'path';
import chalk from 'chalk';
import { memoryService } from './services/memory/memory.service';
import { feedbackService } from './services/feedback.service';
import { toolService } from './services/tool.service';

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

// Ensure results directory exists
const resultsDir = path.resolve(__dirname, '../results');
if (!fs.existsSync(resultsDir)) {
  fs.mkdirSync(resultsDir, { recursive: true });
}

// Helper to resolve project path
const getProjectPath = (req: express.Request) => {
  const projectId = (req.body && req.body.projectId) || (req.query && req.query.projectId) || 'project01';
  const projectPath = path.resolve(__dirname, `../projects/${projectId}`);
  return projectPath;
};

// 0. Initialize session (Backup and clear memory)
app.post('/api/init-session', (req, res) => {
  try {
    const projectPath = getProjectPath(req);
    const messagesPath = path.join(projectPath, 'messages.json');
    const memoPath = path.join(projectPath, 'long_term_memo.json');
    const shortTermPath = path.join(projectPath, 'short_term_memo.md');

    const messagesBackupPath = path.join(projectPath, 'messages.json.bak');
    const memoBackupPath = path.join(projectPath, 'long_term_memo.json.bak');
    const shortTermBackupPath = path.join(projectPath, 'short_term_memo.md.bak');

    console.log(chalk.blue.bold('\n=================== Session Initialized ===================\n'));
    console.log(chalk.gray(`Project Path: ${projectPath}`));

    if (!fs.existsSync(messagesPath)) {
      return res.status(404).json({ error: 'messages.json not found' });
    }

    // Backup Strategy: 
    // If messages.json.bak already exists, it means we have a master copy.
    // We should only backup if it doesn't exist, to avoid overwriting master with partial history.
    // However, if the user manually added more conversations to messages.json, we should update the backup.
    if (!fs.existsSync(messagesBackupPath)) {
      console.log(chalk.gray(`[Init] Creating initial backup from ${messagesPath}`));
      fs.copyFileSync(messagesPath, messagesBackupPath);
    } else {
      const currentMsgs = JSON.parse(fs.readFileSync(messagesPath, 'utf-8'));
      const backupMsgs = JSON.parse(fs.readFileSync(messagesBackupPath, 'utf-8'));
      if (currentMsgs.length > backupMsgs.length) {
        console.log(chalk.yellow(`[Init] messages.json has more conversations (${currentMsgs.length}) than backup (${backupMsgs.length}). Updating backup.`));
        fs.copyFileSync(messagesPath, messagesBackupPath);
      } else {
        console.log(chalk.gray(`[Init] Backup already exists at ${messagesBackupPath}, keeping master copy.`));
      }
    }

    if (fs.existsSync(memoPath) && !fs.existsSync(memoBackupPath)) {
      fs.copyFileSync(memoPath, memoBackupPath);
    }
    if (fs.existsSync(shortTermPath) && !fs.existsSync(shortTermBackupPath)) {
      fs.copyFileSync(shortTermPath, shortTermBackupPath);
    }

    // 2. Clear current state for fresh processing (Matches feedback-agent.ts logic)
    console.log(chalk.gray('  [Init] Clearing current memory state...'));
    if (fs.existsSync(memoPath)) fs.unlinkSync(memoPath);
    if (fs.existsSync(shortTermPath)) fs.unlinkSync(shortTermPath);
    console.log(chalk.green('  ✓ Memory cleared.\n'));

    res.json({ message: 'Session initialized and files backed up' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 1. Get project info
app.get('/api/project', (req, res) => {
  const projectPath = getProjectPath(req);
  res.json({
    name: path.basename(projectPath),
    path: projectPath
  });
});

// New: List all available projects
app.get('/api/projects', (req, res) => {
  const projectsDir = path.resolve(__dirname, '../projects');
  try {
    const folders = fs.readdirSync(projectsDir).filter(file => {
      const fullPath = path.join(projectsDir, file);
      return fs.statSync(fullPath).isDirectory() && !file.startsWith('.');
    });
    res.json({ projects: folders });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// New: Get a random project ID
app.get('/api/random-project', (req, res) => {
  const projectsDir = path.resolve(__dirname, '../projects');
  try {
    const folders = fs.readdirSync(projectsDir).filter(file => {
      const fullPath = path.join(projectsDir, file);
      return fs.statSync(fullPath).isDirectory() && !file.startsWith('.');
    });
    if (folders.length === 0) return res.status(404).json({ error: 'No projects found' });
    const randomProject = folders[Math.floor(Math.random() * folders.length)];
    res.json({ projectId: randomProject });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Get conversations
app.get('/api/conversations', (req, res) => {
  const projectPath = getProjectPath(req);
  const messagesBackupPath = path.join(projectPath, 'messages.json.bak');
  const messagesPath = path.join(projectPath, 'messages.json');
  
  console.log(chalk.gray(`[Conversations] Loading history from: ${messagesBackupPath}`));
  
  // Always read from the backup to get the "full" history
  if (!fs.existsSync(messagesBackupPath)) {
    console.log(chalk.yellow(`[Conversations] Backup not found, falling back to: ${messagesPath}`));
    if (!fs.existsSync(messagesPath)) {
      return res.status(404).json({ error: 'messages.json not found' });
    }
    const history = JSON.parse(fs.readFileSync(messagesPath, 'utf-8'));
    return res.json(history);
  }
  
  const history = JSON.parse(fs.readFileSync(messagesBackupPath, 'utf-8'));
  console.log(chalk.gray(`[Conversations] Found ${history.length} conversations in history.\n`));
  res.json(history);
});

// 3. Memory processing (Step A)
app.post('/api/process-memory', async (req, res) => {
  try {
    const { projectPath, conversationIndex } = req.body;
    const resolvedPath = path.resolve(projectPath);
    const messagesPath = path.join(resolvedPath, 'messages.json');
    const messagesBackupPath = path.join(resolvedPath, 'messages.json.bak');
    const memoPath = path.join(resolvedPath, 'long_term_memo.json');

    // Load full history from backup
    if (!fs.existsSync(messagesBackupPath)) {
      throw new Error('Backup not found. Please initialize session first.');
    }
    const fullHistory = JSON.parse(fs.readFileSync(messagesBackupPath, 'utf-8'));
    const currentConversation = fullHistory[conversationIndex];
    const convId = currentConversation.conversation_id || `#${conversationIndex + 1}`;

    console.log(chalk.blue.bold(`\n╔══════════════════════════════════════════════════════════════════╗`));
    console.log(chalk.blue.bold(`║  Processing Round ${conversationIndex + 1} / ${fullHistory.length}: ${convId}`));
    console.log(chalk.blue.bold(`╚══════════════════════════════════════════════════════════════════╝\n`));

    // ─── Step A: Memory Processing ──────────────────────────────────────
    console.log(chalk.cyan('  [Memory] Processing...'));

    // Simulate partial messages.json (incremental upload) - EXACTLY as feedback-agent.ts logic
    const currentHistory = fullHistory.slice(0, conversationIndex + 1);
    fs.writeFileSync(messagesPath, JSON.stringify(currentHistory, null, 2), 'utf-8');
    console.log(chalk.gray(`    → Incremental messages.json updated (${currentHistory.length} conversations).`));
    
    // Create or Update long-term memory
    if (!fs.existsSync(memoPath)) {
      console.log(chalk.gray('    → Creating Long-term Memory (Initial)...'));
      await memoryService.createLongTermMemory(resolvedPath);
    } else {
      console.log(chalk.gray('    → Updating Long-term Memory...'));
      await memoryService.updateLongTermMemory(resolvedPath);
    }

    // Build Short-term Memory
    console.log(chalk.gray('    → Building Short-term Memory...'));
    const shortTermMemory = await memoryService.createShortTermMemory(resolvedPath);
    console.log(chalk.green('    ✓ Memory processed.\n'));

    res.json({ shortTermMemory });
  } catch (error: any) {
    console.error(chalk.red(`[Error] Memory processing failed: ${error.message}`));
    res.status(500).json({ error: error.message });
  }
});

// Restore backup on exit or manually
app.post('/api/restore-session', (req, res) => {
  try {
    const projectPath = getProjectPath(req);
    const messagesPath = path.join(projectPath, 'messages.json');
    const messagesBackupPath = path.join(projectPath, 'messages.json.bak');
    const memoPath = path.join(projectPath, 'long_term_memo.json');
    const memoBackupPath = path.join(projectPath, 'long_term_memo.json.bak');
    const shortTermPath = path.join(projectPath, 'short_term_memo.md');
    const shortTermBackupPath = path.join(projectPath, 'short_term_memo.md.bak');

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
    console.log(chalk.gray('Backups restored. Session ended.'));
    res.json({ message: 'Backup restored' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});


// 4. File context retrieval (Step B)
app.post('/api/file-context', async (req, res) => {
  try {
    const { projectPath, filePaths } = req.body;
    if (!filePaths || filePaths.length === 0) {
      return res.json({ fileContext: '' });
    }

    const filePathsRelative = filePaths.map((f: string) => {
      const projectRoot = path.resolve(projectPath, '../..');
      return path.relative(projectRoot, f);
    });

    const toolPrompt = `You are analyzing research project files for context. 
Please read the following files and provide a concise summary of each file's content that would be relevant for understanding academic feedback:

Files to read:
${filePathsRelative.map((f: string) => `- ${f}`).join('\n')}

For each file, use the read_file tool to access it, then provide a brief summary focusing on the research content, methodology, and key arguments.`;

    console.log(chalk.cyan('  [Tools] Retrieving file context...'));
    const fileContext = await toolService.runWithTools(toolPrompt, (toolName, args, result) => {
      console.log(chalk.yellow(`    🔨 Tool: ${chalk.bold(toolName)}`));
      console.log(chalk.gray(`       Path: ${args.path || '(n/a)'}`));
      const displayResult = result.length > 200
        ? result.substring(0, 200) + `... (${result.length} chars)`
        : result;
      console.log(chalk.gray(`       Result: ${displayResult}\n`));
    });
    console.log(chalk.green('    ✓ File context retrieved.\n'));

    res.json({ fileContext });
  } catch (error: any) {
    console.error(chalk.red(`[Error] File context retrieval failed: ${error.message}`));
    res.status(500).json({ error: error.message });
  }
});

// 5. Analyze feedback (Step C - Step 1 & 2)
app.post('/api/analyze-feedback', async (req, res) => {
  try {
    const { feedback, studentMessages, enrichedContext } = req.body;
    
    console.log(chalk.cyan('  [Analysis] Interactive Feedback Analysis'));
    console.log(chalk.blue('    Extracting keywords from feedback...'));
    const keywordResult = await feedbackService.extractKeywords(feedback, studentMessages, enrichedContext);
    console.log(chalk.green('    ✓ Keywords Extracted.'));

    console.log(chalk.blue('    Generating Dual Interpretations...'));
    const dualResult = await feedbackService.generateDualInterpretations(feedback, studentMessages, enrichedContext);
    console.log(chalk.green('    ✓ Dual Interpretations Generated.\n'));
    
    res.json({ keywordResult, dualResult });
  } catch (error: any) {
    console.error(chalk.red(`[Error] Feedback analysis failed: ${error.message}`));
    res.status(500).json({ error: error.message });
  }
});

// 6. Check consistency (Step C - Step 5)
app.post('/api/check-consistency', async (req, res) => {
  try {
    const { userReasoning, selectedInterpretation, feedback, studentMessages, keywords, enrichedContext } = req.body;
    
    console.log(chalk.blue(`    Checking consistency of reasoning against ${selectedInterpretation} context...`));
    const result = await feedbackService.checkReasoningConsistency(
      userReasoning,
      selectedInterpretation,
      feedback,
      studentMessages,
      keywords,
      enrichedContext
    );

    // Helper to escape regex special characters
    const escapeRegExp = (string: string) => {
      return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    };

    // Generate highlightedReasoning on the backend
    let highlightedReasoning = userReasoning;
    const allPhrases = [
      ...(result.supportedText || []).map(p => ({ text: p, supported: true })),
      ...(result.unsupportedText || []).map(p => ({ text: p, supported: false }))
    ].sort((a, b) => b.text.length - a.text.length);
    
    allPhrases.forEach(phrase => {
      if (!phrase.text) return;
      const escapedText = phrase.text.replace(/[.*+?^${}()|[\\\]]/g, '\\$&');
      const regex = new RegExp(`(${escapedText})`, 'gi');
      const className = phrase.supported ? 'supported-text' : 'unsupported-text';
      highlightedReasoning = highlightedReasoning.replace(regex, `<span class="${className}">$1</span>`);
    });
    
    console.log(chalk.green('    ✓ Consistency check completed.\n'));

    const responseData = {
      isSupported: result.isSupported ?? false,
      supportedText: result.supportedText || [],
      unsupportedText: result.unsupportedText || [],
      explanation: result.explanation || '',
      highlightedReasoning: highlightedReasoning || userReasoning
    };
    
    res.json(responseData);
  } catch (error: any) {
    console.error(chalk.red(`[Error] Consistency check failed: ${error.message}`));
    res.status(500).json({ error: error.message });
  }
});

// 7. Read file content
app.get('/api/file', (req, res) => {
  const filePath = req.query.path as string;
  if (!filePath) return res.status(400).json({ error: 'Path required' });
  
  try {
    const ext = path.extname(filePath).toLowerCase();
    if (ext === '.pdf') {
      res.setHeader('Content-Type', 'application/pdf');
      return res.sendFile(filePath);
    }
    const content = fs.readFileSync(filePath, 'utf-8');
    res.json({ content });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 8. Save final results
app.post('/api/save-results', (req, res) => {
  try {
    const { userId, projectId, conversationId, mode, finalSelection, confidence, reasoning } = req.body;
    const csvPath = path.join(resultsDir, 'results.csv');
    const timestamp = new Date().toISOString();
    
    const headers = 'Timestamp,UserID,ProjectID,ConversationID,Mode,FinalSelection,Confidence,Reasoning\n';
    if (!fs.existsSync(csvPath)) {
      fs.writeFileSync(csvPath, headers);
    }
    
    // Escape and quote values for CSV
    const escapeCsv = (str: any) => {
      if (str === undefined || str === null) return '""';
      const s = String(str).replace(/"/g, '""');
      return `"${s}"`;
    };

    const row = [
      escapeCsv(timestamp),
      escapeCsv(userId),
      escapeCsv(projectId),
      escapeCsv(conversationId),
      escapeCsv(mode),
      escapeCsv(finalSelection),
      escapeCsv(confidence),
      escapeCsv(reasoning)
    ].join(',') + '\n';

    fs.appendFileSync(csvPath, row);
    console.log(chalk.green(`[Results] Final data saved for ${userId} (Project: ${projectId}, ID: ${conversationId})`));
    res.json({ message: 'Results saved successfully' });
  } catch (error: any) {
    console.error(chalk.red(`[Error] Failed to save results: ${error.message}`));
    res.status(500).json({ error: error.message });
  }
});

// Serve static files from frontend directory
app.use(express.static(path.resolve(__dirname, '../../frontend')));

app.listen(port, () => {
  console.log(`Backend server running at http://localhost:${port}`);
});
