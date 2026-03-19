import { memoryService } from '../services/memory/memory.service';
import * as path from 'path';
import * as fs from 'fs';

async function test() {
  const projectPath = path.resolve(__dirname, '../../projects/project01');
  const memoPath = path.join(projectPath, 'long_term_memo.json');

  // Clean up existing memo
  if (fs.existsSync(memoPath)) {
    fs.unlinkSync(memoPath);
  }

  console.log('--- Testing createLongTermMemory ---');
  await memoryService.createLongTermMemory(projectPath);
  console.log('long_term_memo.json created.');

  let memo = JSON.parse(fs.readFileSync(memoPath, 'utf-8'));
  console.log('Memories after create:', memo.longTermMemories.length);
  console.log('File Summary (Round 1):', memo.longTermMemories[0].fileSummary.substring(0, 100) + '...');

  console.log('\n--- Testing updateLongTermMemory (will process Round 3 as latest) ---');
  await memoryService.updateLongTermMemory(projectPath);
  console.log('long_term_memo.json updated.');

  memo = JSON.parse(fs.readFileSync(memoPath, 'utf-8'));
  console.log('Memories after update:', memo.longTermMemories.length);
  console.log('Latest File Summary (Round 3):', memo.longTermMemories[memo.longTermMemories.length - 1].fileSummary.substring(0, 100) + '...');
  
  console.log('\n--- Testing Compression (adding 5 more dummy memories) ---');
  for (let i = 0; i < 5; i++) {
    await memoryService.updateLongTermMemory(projectPath);
  }
  
  memo = JSON.parse(fs.readFileSync(memoPath, 'utf-8'));
  console.log('Memories after adding 5 more:', memo.longTermMemories.length);
  console.log('Far Memory Content:', memo.farMemory.substring(0, 200) + '...');
}

test().catch(console.error);
