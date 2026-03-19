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
  const projectPath = req.query.projectPath as string || path.resolve(__dirname, '../../projects/project01');
  return path.resolve(projectPath);
};

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
  const messagesPath = path.join(projectPath, 'messages.json');
  if (!fs.existsSync(messagesPath)) {
    return res.status(404).json({ error: 'messages.json not found' });
  }
  const history = JSON.parse(fs.readFileSync(messagesPath, 'utf-8'));
  res.json(history);
});

// 3. Memory processing (Step A)
app.post('/api/process-memory', async (req, res) => {
  try {
    const { projectPath, conversationIndex } = req.body;
    const resolvedPath = path.resolve(projectPath);
    const messagesPath = path.join(resolvedPath, 'messages.json');
    const memoPath = path.join(resolvedPath, 'long_term_memo.json');

    // Simulate incremental upload as in feedback-agent.ts
    const fullHistory = JSON.parse(fs.readFileSync(messagesPath, 'utf-8'));
    const currentHistory = fullHistory.slice(0, conversationIndex + 1);
    
    // We don't actually overwrite the original messages.json for the API
    // but we can pass the data to services if needed. 
    // For now, let's assume services read from messages.json.
    // To match feedback-agent.ts behavior exactly, we'd need to handle this carefully.
    
    // Create/Update long-term memory
    if (!fs.existsSync(memoPath)) {
      await memoryService.createLongTermMemory(resolvedPath);
    } else {
      await memoryService.updateLongTermMemory(resolvedPath);
    }

    const shortTermMemory = await memoryService.createShortTermMemory(resolvedPath);
    res.json({ shortTermMemory });
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

    const fileContext = await toolService.runWithTools(toolPrompt, (toolName, args, result) => {
      console.log(`Tool: ${toolName}, Path: ${args.path}`);
    });

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
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 7. Read file content
app.get('/api/file', (req, res) => {
  const filePath = req.query.path as string;
  if (!filePath) return res.status(400).json({ error: 'Path required' });
  
  try {
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
