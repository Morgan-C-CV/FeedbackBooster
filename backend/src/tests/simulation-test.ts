import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';
import { memoryService } from '../services/memory/memory.service';

/**
 * Utility to wait for user input (Enter key)
 */
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
 * Simulation Test for Memory Service
 * 
 * This script simulates a real-world scenario by:
 * 1. Reading the full conversation history from messages.json.
 * 2. Processing each conversation one by one (simulating sequential uploads).
 * 3. Automatically deciding whether to create or update memory.
 * 4. Generating and displaying short-term memory results.
 */
async function runSimulation() {
    const projectPath = path.resolve(__dirname, '../../projects/project01');
    const messagesPath = path.join(projectPath, 'messages.json');
    const memoPath = path.join(projectPath, 'long_term_memo.json');
    const shortTermPath = path.join(projectPath, 'short_term_memo.md');
    
    // Backup paths
    const messagesBackupPath = path.join(projectPath, 'messages.json.bak');
    const memoBackupPath = path.join(projectPath, 'long_term_memo.json.bak');
    const shortTermBackupPath = path.join(projectPath, 'short_term_memo.md.bak');

    console.log('--- Memory Service Simulation Test ---');
    console.log(`Project Path: ${projectPath}`);

    if (!fs.existsSync(messagesPath)) {
        console.error(`Error: messages.json not found at ${messagesPath}`);
        return;
    }

    // 1. Load full history and backup original files
    const fullHistory = JSON.parse(fs.readFileSync(messagesPath, 'utf-8'));
    fs.copyFileSync(messagesPath, messagesBackupPath);
    if (fs.existsSync(memoPath)) fs.copyFileSync(memoPath, memoBackupPath);
    if (fs.existsSync(shortTermPath)) fs.copyFileSync(shortTermPath, shortTermBackupPath);

    console.log(`Loaded ${fullHistory.length} conversations for simulation.`);
    console.log('Starting simulation. Original files have been backed up.');

    try {
        // 2. Clear current state for fresh start
        if (fs.existsSync(memoPath)) fs.unlinkSync(memoPath);
        if (fs.existsSync(shortTermPath)) fs.unlinkSync(shortTermPath);

        // 3. Process each conversation
        for (let i = 0; i < fullHistory.length; i++) {
            console.log(`\n=========================================`);
            console.log(`Processing Conversation #${i + 1} / ${fullHistory.length}`);
            console.log(`=========================================`);

            await waitForKeyPress('Press [Enter] to simulate uploading this conversation content...');

            // Simulate partial messages.json
            const currentHistory = fullHistory.slice(0, i + 1);
            fs.writeFileSync(messagesPath, JSON.stringify(currentHistory, null, 2), 'utf-8');

            // 4. Decide Create vs Update
            if (!fs.existsSync(memoPath)) {
                console.log('Action: Creating Long-term Memory (Initial)...');
                await memoryService.createLongTermMemory(projectPath);
            } else {
                console.log('Action: Updating Long-term Memory...');
                await memoryService.updateLongTermMemory(projectPath);
            }

            // 5. Build Short-term Memory
            console.log('Action: Building Short-term Memory...');
            const markdown = await memoryService.createShortTermMemory(projectPath);

            // 6. Display Result
            console.log('\n--- Generated Short-term Memory (Markdown Preview) ---');
            console.log(markdown);
            console.log('-----------------------------------------------------\n');

            if (i < fullHistory.length - 1) {
                console.log('Conversation processed successfully.');
            } else {
                console.log('Simulation complete! All conversations processed.');
            }
        }
    } catch (error) {
        console.error('An error occurred during simulation:', error);
    } finally {
        // 7. Restore backups
        console.log('\nRestoring original files from backups...');
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
        console.log('Backups restored. Test finished.');
    }
}

// Run the simulation
runSimulation().catch(console.error);
