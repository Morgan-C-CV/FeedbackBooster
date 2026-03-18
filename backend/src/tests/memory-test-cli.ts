import { memoryService } from '../services/memory/memory.service';

// ============================================================
// Manual test script for MemoryService
// Usage: npx ts-node src/tests/memory-test-cli.ts
// ============================================================

const sampleConversation = `
Mentor: I reviewed your latest draft. The literature review section needs significant rework — you're citing too many papers without synthesizing them into a coherent argument.
Student: I see. Should I focus on fewer key papers?
Mentor: Yes, pick 5-6 seminal works and build your argument around them. Also, your research question is still too broad. Narrow it down to focus on the interaction design aspect specifically.
Student: Got it. What about the methodology section?
Mentor: The methodology is acceptable, but you need to justify why you chose a qualitative approach over a mixed-methods design. Add a paragraph explaining this choice. Also, your interview protocol needs pilot testing before data collection.
Student: Understood. I'll revise and send the next version by Friday.
Mentor: Good. One more thing — the contribution statement is weak. You need to clearly articulate what is novel about your work compared to existing studies.
`;

const sampleBackground = `
The student is working on a Master's thesis about usability of mobile health applications for elderly users.
Previous feedback sessions discussed the initial proposal structure and suggested focusing on accessibility features.
The student has conducted a preliminary literature review covering 30+ papers on mHealth and aging.
`;

const sampleExistingMemory = `
Key decisions:
- Thesis topic: Usability of mobile health apps for elderly users, focusing on accessibility.
- Methodology: Qualitative approach using semi-structured interviews.
- Literature review: Covers 30+ papers on mHealth and aging.

Action items from previous session:
- Narrow down research scope to specific accessibility features.
- Draft interview protocol.
- Submit revised proposal by end of month.
`;

const sampleNewContent = `
Feedback session (latest):
- Literature review needs rework: too many citations without synthesis. Focus on 5-6 seminal works.
- Research question still too broad — narrow to interaction design aspect.
- Methodology acceptable but needs justification for qualitative-only approach.
- Interview protocol requires pilot testing before data collection.
- Contribution statement is weak — needs clearer novelty articulation.
- Next draft due by Friday.
`;

async function runMemoryTests() {
  console.log('╔══════════════════════════════════════════════╗');
  console.log('║        Memory Service — Manual Tests        ║');
  console.log('╚══════════════════════════════════════════════╝\n');

  // ----------------------------------------------------------
  // Test 1: summarizeFeedbackConversation
  // ----------------------------------------------------------
  console.log('━━━ Test 1: summarizeFeedbackConversation ━━━');
  console.log(`Conversation length: ${sampleConversation.length} chars`);
  console.log(`Background length:   ${sampleBackground.length} chars\n`);

  try {
    const feedbackSummary = await memoryService.summarizeFeedbackConversation(
      sampleConversation,
      sampleBackground
    );
    console.log('[Feedback Summary Result]:');
    console.log(feedbackSummary);
  } catch (err) {
    console.error('❌ Test 1 failed:', err);
  }

  console.log('\n');

  // ----------------------------------------------------------
  // Test 2: compressMemory
  // ----------------------------------------------------------
  console.log('━━━ Test 2: compressMemory ━━━');
  console.log(`Existing memory length: ${sampleExistingMemory.length} chars`);
  console.log(`New content length:     ${sampleNewContent.length} chars\n`);

  try {
    const compressedMemory = await memoryService.compressMemory(
      sampleExistingMemory,
      sampleNewContent
    );
    console.log('[Compressed Memory Result]:');
    console.log(compressedMemory);
  } catch (err) {
    console.error('❌ Test 2 failed:', err);
  }

  console.log('\n');

  // ----------------------------------------------------------
  // Test 3: summarizeDocument (skipped if no file path provided)
  // ----------------------------------------------------------
  const testFilePath = process.argv[2];

  if (testFilePath) {
    console.log('━━━ Test 3: summarizeDocument ━━━');
    console.log(`File path: ${testFilePath}\n`);

    try {
      const docSummary = await memoryService.summarizeDocument([testFilePath]);
      console.log('[Document Summary Result]:');
      console.log(docSummary);
    } catch (err) {
      console.error('❌ Test 3 failed:', err);
    }
  } else {
    console.log('━━━ Test 3: summarizeDocument (SKIPPED) ━━━');
    console.log('ℹ️  Pass a file path as argument to test document summarization:');
    console.log('   npx ts-node src/tests/memory-test-cli.ts /path/to/your/file.pdf\n');
  }

  console.log('\n✅ All tests completed.');
}

runMemoryTests();
