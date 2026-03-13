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
    const processResult = await feedbackService.categorizeFeedback(processLevelFeedback, originalContent);
    console.log("\n[Process-Level Result]:");
    console.log(JSON.stringify(processResult, null, 2));

    console.log("\n=== Testing Task-Level Feedback ===");
    console.log(`Feedback: "${taskLevelFeedback}"`);
    const taskResult = await feedbackService.categorizeFeedback(taskLevelFeedback, originalContent);
    console.log("\n[Task-Level Result]:");
    console.log(JSON.stringify(taskResult, null, 2));

  } catch (err) {
    console.error("Error during categorization:", err);
  }
}

runTest();
