import { feedbackService } from '../services/feedback.service';
import chalk from 'chalk';
const { Select, Input } = require('enquirer');

const originalContent = `
# Introduction & Motivation
Recent studies on HCI focusing on older adults have highlighted several usability issues with mobile health applications. 
Many existing apps use small fonts and complex navigation hierarchies. 
My research proposes to build another mobile health app that tracks daily water intake for the elderly. 
The app will use a standard React Native framework and include push notifications.
The main research question is: "How do older adults interact with a water tracking app?"
We plan to use a Technology Acceptance Model (TAM) to evaluate user satisfaction over a 2-week period.
`;

const feedback = "The research question lacks novelty and the positioning is too broad. Building 'another' app without a unique technological or methodological angle doesn't offer a targeted contribution to the HCI community. Also, your theoretical framework explanation is not coherent and the arguments justifying TAM are hard to follow.";

function highlightKeywords(text: string, positions: { startIndex: number, endIndex: number }[]) {
  const sortedPositions = [...positions].sort((a, b) => a.startIndex - b.startIndex);

  let highlightedText = "";
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

async function runInteractiveTest() {
  console.log(chalk.blue.bold("\n=================== Interactive Feedback Analysis ===================\n"));

  console.log(chalk.gray("--- Original Content ---\n"));
  console.log(chalk.gray(originalContent.trim()));
  console.log("\n\n");

  console.log(chalk.white("--- Feedback ---\n"));
  console.log(chalk.bold(feedback));
  console.log("\n\n");

  try {
    const keywordResult = await feedbackService.extractKeywords(feedback, originalContent);

    console.log(chalk.green("Keywords Extracted:\n"));
    const highlightedFeedback = highlightKeywords(feedback, keywordResult.keywordPositions || []);
    console.log(highlightedFeedback);
    console.log("\n");

    console.log(chalk.blue("Generating Dual Interpretations..."));
    const dualResult = await feedbackService.generateDualInterpretations(feedback, originalContent);

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

    console.log("\n" + chalk.blue(`Checking consistency of your reasoning against the ${answer} context...`));

    const consistencyResult = await feedbackService.checkReasoningConsistency(
      userReasoning,
      answer,
      feedback,
      originalContent,
      keywordResult.keywords
    );



    console.log(chalk.gray(`Explanation: ${consistencyResult.explanation}\n`));

    console.log(chalk.bold("Your Reasoning (Supported parts in GREEN, Unsupported in RED):"));
    const evaluatedReasoning = highlightReasoning(
      userReasoning,
      consistencyResult.supportedText || [],
      consistencyResult.unsupportedText || []
    );
    console.log(evaluatedReasoning);

    console.log(chalk.blue.bold("\n=====================================================================\n"));

  } catch (err) {
    console.error(chalk.red("Error during the process:"), err);
  }
}

// Execute the interactive CLI
runInteractiveTest();
