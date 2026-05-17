import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { MemoryService } from './services/memory/memory.service';
import { FeedbackService } from './services/feedback.service';
import { ToolService } from './services/tool.service';

type Bindings = {
  FB_BUCKET: R2Bucket;
  GEMINI_API_KEY: string;
};

const app = new Hono<{ Bindings: Bindings }>();

app.use('*', cors());

// Helper to handle simple responses
const json = (c: any, data: any, status = 200) => c.json(data, status);

app.get('/api/projects', async (c) => {
  try {
    // List folders in projects/
    const list = await c.env.FB_BUCKET.list({ prefix: 'projects/', delimiter: '/' });
    const folders = list.delimitedPrefixes.map(p => {
      // p is like "projects/project01/"
      return p.split('/')[1];
    });
    return json(c, { projects: folders });
  } catch (err: any) {
    return json(c, { error: err.message }, 500);
  }
});

app.get('/api/random-project', async (c) => {
  try {
    const list = await c.env.FB_BUCKET.list({ prefix: 'projects/', delimiter: '/' });
    const folders = list.delimitedPrefixes.map(p => p.split('/')[1]);
    if (folders.length === 0) return json(c, { error: 'No projects found' }, 404);
    const randomProject = folders[Math.floor(Math.random() * folders.length)];
    return json(c, { projectId: randomProject });
  } catch (err: any) {
    return json(c, { error: err.message }, 500);
  }
});

app.get('/api/project', (c) => {
  const projectId = c.req.query('projectId');
  if (!projectId) return json(c, { error: 'projectId required' }, 400);
  
  return json(c, {
    name: projectId,
    path: `projects/${projectId}`
  });
});

app.post('/api/init-session', async (c) => {
  try {
    const body = await c.req.json().catch(() => ({}));
    const projectId = body.projectId || c.req.query('projectId') || 'project01';
    
    const messagesKey = `projects/${projectId}/messages.json`;
    const memoKey = `projects/${projectId}/long_term_memo.json`;
    const shortTermKey = `projects/${projectId}/short_term_memo.md`;

    const messagesBackupKey = `projects/${projectId}/messages.json.bak`;
    const memoBackupKey = `projects/${projectId}/long_term_memo.json.bak`;
    const shortTermBackupKey = `projects/${projectId}/short_term_memo.md.bak`;

    const msgsObj = await c.env.FB_BUCKET.get(messagesKey);
    if (!msgsObj) return json(c, { error: 'messages.json not found' }, 404);

    const msgsBackupObj = await c.env.FB_BUCKET.get(messagesBackupKey);
    if (!msgsBackupObj) {
      const msgsData = await msgsObj.arrayBuffer();
      await c.env.FB_BUCKET.put(messagesBackupKey, msgsData);
    } else {
      const currentMsgs = await msgsObj.json() as any[];
      const backupMsgs = await msgsBackupObj.json() as any[];
      if (currentMsgs.length > backupMsgs.length) {
        await c.env.FB_BUCKET.put(messagesBackupKey, JSON.stringify(currentMsgs));
      }
    }

    const memoObj = await c.env.FB_BUCKET.get(memoKey);
    if (memoObj && !(await c.env.FB_BUCKET.get(memoBackupKey))) {
      await c.env.FB_BUCKET.put(memoBackupKey, await memoObj.arrayBuffer());
    }

    const stObj = await c.env.FB_BUCKET.get(shortTermKey);
    if (stObj && !(await c.env.FB_BUCKET.get(shortTermBackupKey))) {
      await c.env.FB_BUCKET.put(shortTermBackupKey, await stObj.arrayBuffer());
    }

    await c.env.FB_BUCKET.delete(memoKey);
    await c.env.FB_BUCKET.delete(shortTermKey);

    return json(c, { message: 'Session initialized and files backed up' });
  } catch (error: any) {
    return json(c, { error: error.message }, 500);
  }
});

app.get('/api/conversations', async (c) => {
  const projectId = c.req.query('projectId') || 'project01';
  const messagesBackupKey = `projects/${projectId}/messages.json.bak`;
  const messagesKey = `projects/${projectId}/messages.json`;
  
  let obj = await c.env.FB_BUCKET.get(messagesBackupKey);
  if (!obj) {
    obj = await c.env.FB_BUCKET.get(messagesKey);
    if (!obj) return json(c, { error: 'messages.json not found' }, 404);
  }
  
  const history = await obj.json();
  return json(c, history);
});

app.post('/api/process-memory', async (c) => {
  try {
    const { projectPath, conversationIndex } = await c.req.json();
    const projectId = projectPath.split('/').pop();
    const memoryService = new MemoryService(c.env.GEMINI_API_KEY);

    const messagesKey = `projects/${projectId}/messages.json`;
    const messagesBackupKey = `projects/${projectId}/messages.json.bak`;
    const memoKey = `projects/${projectId}/long_term_memo.json`;

    const backupObj = await c.env.FB_BUCKET.get(messagesBackupKey);
    if (!backupObj) throw new Error('Backup not found. Please initialize session first.');
    const fullHistory = await backupObj.json() as any[];

    const currentHistory = fullHistory.slice(0, conversationIndex + 1);
    await c.env.FB_BUCKET.put(messagesKey, JSON.stringify(currentHistory, null, 2));
    
    const memoObj = await c.env.FB_BUCKET.get(memoKey);
    if (!memoObj) {
      await memoryService.createLongTermMemory(projectId, c.env.FB_BUCKET);
    } else {
      await memoryService.updateLongTermMemory(projectId, c.env.FB_BUCKET);
    }

    const shortTermMemory = await memoryService.createShortTermMemory(projectId, c.env.FB_BUCKET);
    return json(c, { shortTermMemory });
  } catch (error: any) {
    return json(c, { error: error.message }, 500);
  }
});

app.post('/api/restore-session', async (c) => {
  try {
    const body = await c.req.json().catch(() => ({}));
    const projectId = body.projectId || c.req.query('projectId') || 'project01';
    
    const messagesKey = `projects/${projectId}/messages.json`;
    const messagesBackupKey = `projects/${projectId}/messages.json.bak`;
    const memoKey = `projects/${projectId}/long_term_memo.json`;
    const memoBackupKey = `projects/${projectId}/long_term_memo.json.bak`;
    const shortTermKey = `projects/${projectId}/short_term_memo.md`;
    const shortTermBackupKey = `projects/${projectId}/short_term_memo.md.bak`;

    const mbObj = await c.env.FB_BUCKET.get(messagesBackupKey);
    if (mbObj) {
      await c.env.FB_BUCKET.put(messagesKey, await mbObj.arrayBuffer());
      await c.env.FB_BUCKET.delete(messagesBackupKey);
    }
    const mmObj = await c.env.FB_BUCKET.get(memoBackupKey);
    if (mmObj) {
      await c.env.FB_BUCKET.put(memoKey, await mmObj.arrayBuffer());
      await c.env.FB_BUCKET.delete(memoBackupKey);
    }
    const sbObj = await c.env.FB_BUCKET.get(shortTermBackupKey);
    if (sbObj) {
      await c.env.FB_BUCKET.put(shortTermKey, await sbObj.arrayBuffer());
      await c.env.FB_BUCKET.delete(shortTermBackupKey);
    }

    return json(c, { message: 'Backup restored' });
  } catch (error: any) {
    return json(c, { error: error.message }, 500);
  }
});

app.post('/api/file-context', async (c) => {
  try {
    const { projectPath, filePaths } = await c.req.json();
    if (!filePaths || filePaths.length === 0) return json(c, { fileContext: '' });
    
    const toolService = new ToolService(c.env.GEMINI_API_KEY);
    const toolPrompt = `You are analyzing research project files for context. 
Please read the following files and provide a concise summary of each file's content that would be relevant for understanding academic feedback:

Files to read:
${filePaths.map((f: string) => `- ${f}`).join('\n')}

For each file, use the read_file tool to access it, then provide a brief summary focusing on the research content, methodology, and key arguments.`;

    const fileContext = await toolService.runWithTools(toolPrompt, c.env.FB_BUCKET);
    return json(c, { fileContext });
  } catch (error: any) {
    return json(c, { error: error.message }, 500);
  }
});

app.post('/api/analyze-feedback', async (c) => {
  try {
    const { feedback, studentMessages, enrichedContext } = await c.req.json();
    const feedbackService = new FeedbackService(c.env.GEMINI_API_KEY);
    
    const keywordResult = await feedbackService.extractKeywords(feedback, studentMessages, enrichedContext);
    const dualResult = await feedbackService.generateDualInterpretations(feedback, studentMessages, enrichedContext);
    
    return json(c, { keywordResult, dualResult });
  } catch (error: any) {
    return json(c, { error: error.message }, 500);
  }
});

app.post('/api/check-consistency', async (c) => {
  try {
    const { userReasoning, selectedInterpretation, feedback, studentMessages, keywords, enrichedContext } = await c.req.json();
    const feedbackService = new FeedbackService(c.env.GEMINI_API_KEY);
    
    const result = await feedbackService.checkReasoningConsistency(
      userReasoning, selectedInterpretation, feedback, studentMessages, keywords, enrichedContext
    );

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

    return json(c, {
      isSupported: result.isSupported ?? false,
      supportedText: result.supportedText || [],
      unsupportedText: result.unsupportedText || [],
      explanation: result.explanation || '',
      highlightedReasoning: highlightedReasoning || userReasoning
    });
  } catch (error: any) {
    return json(c, { error: error.message }, 500);
  }
});

app.get('/api/file', async (c) => {
  const filePath = c.req.query('path');
  if (!filePath) return json(c, { error: 'Path required' }, 400);
  
  try {
    // Normalizing path
    let key = filePath;
    if (key.includes('/projects/')) key = key.substring(key.indexOf('projects/'));
    if (key.startsWith('/')) key = key.substring(1);
    
    const obj = await c.env.FB_BUCKET.get(key);
    if (!obj) return json(c, { error: 'File not found' }, 404);
    
    const ext = key.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') {
      const headers = new Headers();
      headers.set('Content-Type', 'application/pdf');
      obj.writeHttpMetadata(headers);
      return new Response(obj.body, { headers });
    }
    
    const content = await obj.text();
    return json(c, { content });
  } catch (error: any) {
    return json(c, { error: error.message }, 500);
  }
});

app.post('/api/save-results', async (c) => {
  try {
    const { userId, projectId, conversationId, mode, finalSelection, confidence, reasoning } = await c.req.json();
    const csvKey = 'results/results.csv';
    const timestamp = new Date().toISOString();
    
    const headersStr = 'Timestamp,UserID,ProjectID,ConversationID,Mode,FinalSelection,Confidence,Reasoning\n';
    
    let existingCsv = '';
    const obj = await c.env.FB_BUCKET.get(csvKey);
    if (obj) {
      existingCsv = await obj.text();
    } else {
      existingCsv = headersStr;
    }
    
    const escapeCsv = (str: any) => {
      if (str === undefined || str === null) return '""';
      const s = String(str).replace(/"/g, '""');
      return `"${s}"`;
    };

    const row = [
      escapeCsv(timestamp), escapeCsv(userId), escapeCsv(projectId), escapeCsv(conversationId),
      escapeCsv(mode), escapeCsv(finalSelection), escapeCsv(confidence), escapeCsv(reasoning)
    ].join(',') + '\n';

    await c.env.FB_BUCKET.put(csvKey, existingCsv + row);
    
    return json(c, { message: 'Results saved successfully' });
  } catch (error: any) {
    return json(c, { error: error.message }, 500);
  }
});

export default app;
