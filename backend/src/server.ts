import express from 'express';
import cors from 'cors';
import * as fs from 'fs';
import * as path from 'path';
import { memoryService } from './services/memory/memory.service';
import { feedbackService } from './services/feedback.service';
import { toolService } from './services/tool.service';

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

// Helper to resolve project path
const getProjectPath = (req: express.Request) => {
  const projectPath = req.query.projectPath as string || path.resolve(__dirname, '../projects/project01');
  return path.resolve(projectPath);
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

    if (!fs.existsSync(messagesPath)) {
      return res.status(404).json({ error: 'messages.json not found' });
    }

    // Backup
    fs.copyFileSync(messagesPath, messagesBackupPath);
    if (fs.existsSync(memoPath)) fs.copyFileSync(memoPath, memoBackupPath);
    if (fs.existsSync(shortTermPath)) fs.copyFileSync(shortTermPath, shortTermBackupPath);

    // Clear current state
    if (fs.existsSync(memoPath)) fs.unlinkSync(memoPath);
    if (fs.existsSync(shortTermPath)) fs.unlinkSync(shortTermPath);

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

// 2. Get conversations
app.get('/api/conversations', (req, res) => {
  const projectPath = getProjectPath(req);
  const messagesBackupPath = path.join(projectPath, 'messages.json.bak');
  const messagesPath = path.join(projectPath, 'messages.json');
  
  // Always read from the backup if it exists to get the "full" history
  const pathToRead = fs.existsSync(messagesBackupPath) ? messagesBackupPath : messagesPath;
  
  if (!fs.existsSync(pathToRead)) {
    return res.status(404).json({ error: 'messages.json not found' });
  }
  const history = JSON.parse(fs.readFileSync(pathToRead, 'utf-8'));
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
    const currentHistory = fullHistory.slice(0, conversationIndex + 1);
    
    // OVERWRITE messages.json with partial history to match feedback-agent.ts logic
    fs.writeFileSync(messagesPath, JSON.stringify(currentHistory, null, 2), 'utf-8');
    
    // Create/Update long-term memory
    console.log(`[Memory] Processing memory for conversation ${conversationIndex}...`);
    if (!fs.existsSync(memoPath)) {
      console.log(`[Memory] Creating long-term memory at ${memoPath}`);
      await memoryService.createLongTermMemory(resolvedPath);
    } else {
      console.log(`[Memory] Updating long-term memory at ${memoPath}`);
      await memoryService.updateLongTermMemory(resolvedPath);
    }

    console.log(`[Memory] Creating short-term memory...`);
    const shortTermMemory = await memoryService.createShortTermMemory(resolvedPath);
    console.log(`[Memory] Short-term memory created successfully.`);
    res.json({ shortTermMemory });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Restore backup on exit or manually
app.post('/api/restore-session', (req, res) => {
  try {
    const projectPath = getProjectPath(req);
    const messagesPath = path.join(projectPath, 'messages.json');
    const messagesBackupPath = path.join(projectPath, 'messages.json.bak');
    // ... similarly for others
    if (fs.existsSync(messagesBackupPath)) {
      fs.copyFileSync(messagesBackupPath, messagesPath);
      fs.unlinkSync(messagesBackupPath);
    }
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

    console.log(`[FileContext] Retrieving context for ${filePaths.length} files...`);
    const fileContext = await toolService.runWithTools(toolPrompt, (toolName, args, result) => {
      console.log(`[FileContext] Tool: ${toolName}, Path: ${args.path}`);
    });
    console.log(`[FileContext] Retrieval completed.`);

    res.json({ fileContext });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 5. Analyze feedback (Step C - Step 1 & 2)
app.post('/api/analyze-feedback', async (req, res) => {
  try {
    const { feedback, studentMessages, enrichedContext } = req.body;
    const keywordResult = await feedbackService.extractKeywords(feedback, studentMessages, enrichedContext);
    const dualResult = await feedbackService.generateDualInterpretations(feedback, studentMessages, enrichedContext);
    
    res.json({ keywordResult, dualResult });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 6. Check consistency (Step C - Step 5)
app.post('/api/check-consistency', async (req, res) => {
  try {
    const { userReasoning, selectedInterpretation, feedback, studentMessages, keywords, enrichedContext } = req.body;
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
    
    console.log("[Consistency] Phrases to highlight:", allPhrases);

    allPhrases.forEach(phrase => {
      if (!phrase.text) return;
      // Escape regex special characters to prevent errors
      const escapedText = phrase.text.replace(/[.*+?^${}()|[\\\]]/g, '\\$&');
      const regex = new RegExp(`(${escapedText})`, 'gi');
      const className = phrase.supported ? 'supported-text' : 'unsupported-text';
      highlightedReasoning = highlightedReasoning.replace(regex, `<span class="${className}">$1</span>`);
    });
    
    console.log("[Consistency] Final Highlighted HTML:", highlightedReasoning);

    const responseData = {
      isSupported: result.isSupported ?? false,
      supportedText: result.supportedText || [],
      unsupportedText: result.unsupportedText || [],
      explanation: result.explanation || '',
      highlightedReasoning: highlightedReasoning || userReasoning
    };
    
    console.log("[Consistency] Sending response to frontend:", JSON.stringify(responseData, null, 2));
    res.json(responseData);
  } catch (error: any) {
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

// Serve static files from frontend directory
app.use(express.static(path.resolve(__dirname, '../../frontend')));

app.listen(port, () => {
  console.log(`Backend server running at http://localhost:${port}`);
});
