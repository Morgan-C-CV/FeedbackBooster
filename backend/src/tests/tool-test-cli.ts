import { toolService } from '../services/tool.service';
import chalk from 'chalk';
import * as readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function prompt(question: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

async function main() {
  console.log(chalk.blue.bold('\n🔧 Tool Service Interactive CLI'));
  console.log(chalk.gray('Type natural language commands to interact with the project files.'));
  console.log(chalk.gray('The LLM will decide which tool(s) to use automatically.'));
  console.log(chalk.gray('Type "exit" or "quit" to leave.\n'));

  while (true) {
    const userInput = await prompt(chalk.cyan('You > '));

    if (!userInput.trim()) continue;
    if (['exit', 'quit'].includes(userInput.trim().toLowerCase())) {
      console.log(chalk.yellow('\nGoodbye! 👋\n'));
      break;
    }

    console.log(chalk.gray('\n⏳ Thinking...\n'));

    try {
      const result = await toolService.runWithTools(
        userInput,
        (toolName, args, toolResult) => {
          console.log(chalk.yellow(`  🔨 Tool Called: ${chalk.bold(toolName)}`));
          console.log(chalk.gray(`     Args: ${JSON.stringify(args, null, 2).split('\n').join('\n     ')}`));
          
          // Truncate long results for display
          const displayResult = toolResult.length > 500
            ? toolResult.substring(0, 500) + `\n     ... (${toolResult.length} chars total)`
            : toolResult;
          console.log(chalk.green(`     Result: ${displayResult}`));
          console.log('');
        }
      );

      console.log(chalk.white.bold('🤖 Assistant: ') + result);
      console.log('');
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      console.log('');
    }
  }

  rl.close();
}

main();
