# User Study Instructions

Thank you for participating in this study. This guide explains exactly what you will do in the interface and what each experiment mode means.

## Study Goal

This study evaluates how participants classify advisor feedback as:

- Task-Level: what should be fixed in the current work
- Process-Level: how the research direction, framing, or strategy should be adjusted

The experiment compares three evaluation methods in a controlled 6-round workflow.

Please read and sign the separate consent document before starting: `doc/consent.md`

## 1. Before You Start (Setup Screen)

When the app opens, you will see:

- Tester Number
Enter your assigned participant ID, for example `001` or `005`.
- Experiment Mode
Keep this ON for formal user experiments. In this mode, the system runs 3 pilot method trials first and then 6 formal project rounds.
- Enable Agent Assist
In Experiment Mode, this toggle is controlled by the system design. Outside Experiment Mode, it can be used for non-experiment or manual runs.

Click `Start Study`.

## 2. Pilot Test (Trial Run)

Before the formal experiment starts, you will complete 3 pilot trials, one for each method: Human-Only, Chatbot-Assisted, and RMA-Assist.

These pilot trials are only for familiarization:

- each pilot covers one conversation only
- a pilot does not require completing a full project
- pilot responses are not recorded

If anything is unclear during the pilot, ask the tester for clarification.

## 3. Overall Experiment Structure

The formal experiment consists of 6 project rounds in total. During the study, you will use 3 different methods, and each method will be assigned to 2 complete projects. The order of these methods is randomized.

At the start of every project round, a popup will tell you which method is currently active. You can also confirm the active method from the badge in the top bar.

### Method Definitions

- Method 1: Human-Only
Pure human judgment. Do not use external tools. The system does not run memory processing, keyword highlight, or consistency check. Read the project content, then submit reasoning, final choice, and confidence.
- Method 2: Chatbot-Assisted
You may use Gemini externally as assistance. The system does not run memory processing, keyword highlight, or consistency check. Read the project content, then submit reasoning, final choice, and confidence.
- Method 3: RMA-Assist
Full assisted workflow. Includes memory and context loading, interpretation generation, keyword highlight, and consistency check.

Each assigned project may contain multiple conversations. You must complete all conversations in the current project before moving to the next project round.

## 4. Interface Areas

- Left panel (File Viewer): opens linked files in the conversation
- Right panel (Conversation): shows advisor-student dialogue
- Bottom interaction bar: shows step-by-step tasks for the current method
- Top status indicator: shows real-time system progress, including loading state

## 5. What To Do in Each Round

### A. For Method 1 and Method 2

1. Read the conversation and files.
2. Go to Final Decision & Confidence.
3. Fill in:
   Brief Reasoning
   Final Level Choice (`Task-Level` or `Process-Level`)
   Confidence Score (`1` to `5`)
4. Click `Submit Final Results`.
5. Click `Next Conversation` until the current project is fully completed.
6. After the last conversation of that project, continue to the next assigned project.

### B. For Method 3 (RMA-Assist)

1. Wait until round context loading completes for the current conversation.
2. Click `Start Analysis`.
3. In Step B: Dual Interpretations, select the most primary factor.
4. In Step C: Your Reasoning, explain why you chose one option instead of the other. Be as complete as possible.
5. In Step D: Consistency Check, review the AI highlighting.
6. Go to Final Decision & Confidence, then submit the result.
7. Click `Next Conversation` until the current project is fully completed.
8. After the last conversation of that project, continue to the next assigned project.

## 6. Submission Rules

A conversation can be submitted only after all required fields are completed.

- Required in Method 1 and Method 2:
Brief Reasoning, Final Choice, Confidence Score
- Required in Method 3:
Step C Reasoning, Final Choice, Confidence Score

## 7. Completion

After all 6 formal project rounds are finished, the system shows a completion confirmation.

Please notify the research administrator that your session is complete.

## 8. Notes for Participants

- Focus on the primary signal in advisor feedback, not secondary details.
- Task-Level vs Process-Level distinction:
Task-Level means what should be fixed or clarified in the current output.
Process-Level means higher-level framing, strategy, method direction, or research positioning.
- If any technical issue appears, stop and report it immediately.

## 9. Data and Privacy Summary

Stored data may include tester ID, project ID, conversation ID, selected method mode, final choice, confidence, reasoning, and timestamp.

The study uses participant IDs for indexing and analysis. Do not enter personal secrets in any text field.

If you encounter issues during the study, please contact the research administrator.
