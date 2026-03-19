import { memoryService } from '../services/memory/memory.service';
import * as path from 'path';
import * as fs from 'fs';

async function testShortTerm() {
  const projectPath = path.resolve(__dirname, '../../projects/project01');
  const shortTermPath = path.join(projectPath, 'short_term_memo.md');

  console.log('--- Testing createShortTermMemory ---');
  try {
    const markdown = await memoryService.createShortTermMemory(projectPath);
    console.log('short_term_memo.md generated successfully.');
    
    if (fs.existsSync(shortTermPath)) {
        const content = fs.readFileSync(shortTermPath, 'utf-8');
        console.log('\n--- Generated Markdown Preview ---');
        console.log(content.substring(0, 500) + '...');
    } else {
        console.error('Error: File was not written to disk!');
    }
  } catch (error) {
    console.error('Error during test:', error);
  }
}

testShortTerm().catch(console.error);
