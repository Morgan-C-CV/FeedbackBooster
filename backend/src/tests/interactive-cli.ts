import { feedbackService } from '../services/feedback.service';
import chalk from 'chalk';
const { Select, Input } = require('enquirer');

const originalContent = `
Recent studies on HCI focusing on older adults have highlighted several usability issues. 
However, the research question lacks novelty and the positioning is too broad for a targeted contribution. 
Furthermore, your theoretical framework explanation is not coherent and the arguments are hard to follow.
`;

const processLevelFeedback = "The research question lacks novelty and the positioning is too broad.";

function highlightKeywords(text: string, positions: { startIndex: number, endIndex: number }[]) {
  // Sort positions just in case
  const sortedPositions = [...positions].sort((a, b) => a.startIndex - b.startIndex);

  let highlightedText = "";
  let currentIndex = 0;

  for (const pos of sortedPositions) {
    if (pos.startIndex >= currentIndex) {
      // Add text before the keyword
      highlightedText += text.substring(currentIndex, pos.startIndex);
      // Add the highlighted keyword
      highlightedText += chalk.bgYellow.black(text.substring(pos.startIndex, pos.endIndex));
      currentIndex = pos.endIndex;
    }
  }
  // Add remaining text
  highlightedText += text.substring(currentIndex);

  return highlightedText;
}

async function runInteractiveTest() {
  console.log(chalk.blue.bold("\n=================== Interactive Feedback Analysis ===================\n"));

  console.log(chalk.gray("--- Original Content ---\n"));
  console.log(chalk.gray(originalContent.trim()));
  console.log("\n\n");

  console.log(chalk.white("--- Feedback ---\n"));
  console.log(chalk.bold(processLevelFeedback));
  console.log("\n\n");

  try {
    const keywordResult = await feedbackService.extractKeywords(processLevelFeedback, originalContent);

    console.log(chalk.green("Keywords Extracted:\n"));
    const highlightedFeedback = highlightKeywords(processLevelFeedback, keywordResult.keywordPositions || []);
    console.log(highlightedFeedback);
    console.log("\n");

    console.log(chalk.blue("Generating Dual Interpretations..."));
    const dualResult = await feedbackService.generateDualInterpretations(processLevelFeedback, originalContent);

    console.log(chalk.bold("Task-Level Interpretation: ") + dualResult.taskLevelInterpretation.reasoning + "\n");
    console.log(chalk.bold("Process-Level Interpretation: ") + dualResult.processLevelInterpretation.reasoning + "\n");

    const prompt = new Select({
      name: 'interpretation',
      message: 'Based on the context, which level do you think this feedback belongs to?',
      choices: [
        { name: 'Task-Level', message: 'Task-Level' },
        { name: 'Process-Level', message: 'Process-Level' }
      ]
    });

    const answer = await prompt.run();

    console.log("\n");
    console.log(chalk.cyan(`You selected: ${answer}`));

    const reasonPrompt = new Input({
      message: `Why did you choose ${answer} over the other option? Please provide your reasoning:\n`,
    });

    const userReasoning = await reasonPrompt.run();

    console.log("\n");
    console.log(chalk.white(`Your logged reasoning: "${userReasoning}"`));
    console.log(chalk.blue.bold("\n=====================================================================\n"));

  } catch (err) {
    console.error(chalk.red("Error during the process:"), err);
  }
}

// Execute the interactive CLI
runInteractiveTest();
