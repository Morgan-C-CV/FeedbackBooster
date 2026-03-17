import { feedbackService } from '../services/feedback.service';

const originalContent = `
Recent studies on HCI focusing on older adults have highlighted several usability issues. 
However, the research question lacks novelty and the positioning is too broad for a targeted contribution. 
Furthermore, your theoretical framework explanation is not coherent and the arguments are hard to follow.
`;

const processLevelFeedback = "The research question lacks novelty and the positioning is too broad.";
const taskLevelFeedback = "Your theoretical framework explanation is not coherent and the arguments are hard to follow.";




async function runTest() {
  console.log("=== Testing Process-Level Feedback ===");
  console.log(`Original Content length: ${originalContent.length}`);
  console.log(`Feedback: "${processLevelFeedback}"`);

  try {
    const processResult = await feedbackService.extractKeywords(processLevelFeedback, originalContent);
    console.log("\n[Process-Level Result]:");
    console.log(JSON.stringify(processResult, null, 2));

    console.log("\n=== Testing Task-Level Feedback ===");
    console.log(`Feedback: "${taskLevelFeedback}"`);
    const taskResult = await feedbackService.extractKeywords(taskLevelFeedback, originalContent);
    console.log("\n[Task-Level Result]:");
    console.log(JSON.stringify(taskResult, null, 2));

    console.log("\n=== Testing Dual Interpretations ===");
    console.log(`Feedback: "${processLevelFeedback}"`);
    const dualResult = await feedbackService.generateDualInterpretations(processLevelFeedback, originalContent);
    console.log("\n[Dual Interpretations Result]:");
    console.log(JSON.stringify(dualResult, null, 2));

    console.log("\n=== Testing Reasoning Consistency ===");
    const sampleReasoning = "I chose Process-Level because the feedback mentions 'research question lacks novelty', which means the entire direction is wrong, but it doesn't mean the writing itself is bad.";
    console.log(`User Reasoning: "${sampleReasoning}"`);
    const consistencyResult = await feedbackService.checkReasoningConsistency(
      sampleReasoning,
      "Process-Level",
      processLevelFeedback,
      originalContent,
      processResult.keywords
    );
    console.log("\n[Consistency Result]:");
    console.log(JSON.stringify(consistencyResult, null, 2));

    console.log("\n=== Testing Image Reading ===");
    const imagePath = '/Users/mgccvmacair/Myproject/Academic/ResearchProject/backend/src/examples/pics/testimage.png';
    const imageResult = await (await import('../services/llm.service')).llmService.generateContent("Please describe this image in detail.", [imagePath]);
    console.log(`[Image Result]:\n${imageResult}`);

  } catch (err) {
    console.error("Error during categorization:", err);
  }
}

runTest();
