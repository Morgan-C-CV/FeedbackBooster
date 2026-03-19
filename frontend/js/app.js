const API_URL = 'http://localhost:3001/api';

// State management
let state = {
    project: null,
    conversations: [],
    currentIndex: 0,
    currentShortTermMemory: '',
    currentDualResult: null,
    currentKeywordResult: null,
    selectedInterpretation: '',
    currentFileContext: ''
};

// DOM Elements
const projectNameEl = document.getElementById('project-name');
const conversationArea = document.getElementById('conversation-area');
const fileContentArea = document.getElementById('file-content');
const statusIndicator = document.getElementById('status-indicator');

// Interaction steps
const steps = {
    memory: document.getElementById('interaction-step-memory'),
    analysis: document.getElementById('interaction-step-analysis'),
    reasoning: document.getElementById('interaction-step-reasoning'),
    result: document.getElementById('interaction-step-result')
};

// Initialize
async function init() {
    try {
        updateStatus('Loading project...', 'busy');
        
        // Get project info
        const projectRes = await fetch(`${API_URL}/project`);
        state.project = await projectRes.json();
        projectNameEl.textContent = `Project: ${state.project.name}`;

        // Get conversations
        const convRes = await fetch(`${API_URL}/conversations`);
        state.conversations = await convRes.json();

        if (state.conversations.length > 0) {
            startConversation(0);
        } else {
            updateStatus('No conversations found', 'error');
        }
    } catch (err) {
        console.error('Initialization error:', err);
        updateStatus('Error connecting to backend', 'error');
    }
}

function updateStatus(text, type = 'idle') {
    statusIndicator.textContent = text;
    statusIndicator.className = `status-indicator status-${type}`;
}

async function startConversation(index) {
    state.currentIndex = index;
    const conversation = state.conversations[index];
    
    // Clear previous
    conversationArea.innerHTML = '';
    showStep('memory');
    updateStatus(`Processing Conversation ${index + 1}/${state.conversations.length}`, 'busy');

    // Display all messages in the conversation area
    renderConversation(conversation);

    // Step A: Process Memory
    try {
        const memoryRes = await fetch(`${API_URL}/process-memory`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                projectPath: state.project.path,
                conversationIndex: index
            })
        });
        const memoryData = await memoryRes.json();
        state.currentShortTermMemory = memoryData.shortTermMemory;
        document.getElementById('short-term-memory-display').textContent = state.currentShortTermMemory;

        // Step B: Get File Context
        const filePaths = extractFilePaths(conversation);
        const contextRes = await fetch(`${API_URL}/file-context`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                projectPath: state.project.path,
                filePaths: filePaths
            })
        });
        const contextData = await contextRes.json();
        state.currentFileContext = contextData.fileContext;

        document.getElementById('btn-next-step').disabled = false;
        updateStatus('Ready for analysis', 'idle');
    } catch (err) {
        console.error('Memory processing error:', err);
        updateStatus('Error in memory processing', 'error');
    }
}

function renderConversation(conversation) {
    conversation.records.forEach(record => {
        if (record.type === 'message') {
            const msgEl = document.createElement('div');
            msgEl.className = `message message-${record.sender}`;
            
            const senderName = conversation.participants?.[record.sender] || record.sender;
            const senderSpan = document.createElement('span');
            senderSpan.className = 'sender-name';
            senderSpan.textContent = senderName;
            
            const contentDiv = document.createElement('div');
            contentDiv.className = 'message-content';
            
            // Process content for file links
            let content = record.content || '';
            content = content.replace(/(\/[^\s]+\.[a-zA-Z0-9]+)/g, (match) => {
                return `<span class="file-link" onclick="loadFile('${match}')">${match}</span>`;
            });
            
            contentDiv.innerHTML = content;
            
            msgEl.appendChild(senderSpan);
            msgEl.appendChild(contentDiv);
            conversationArea.appendChild(msgEl);
        }
    });
}

async function loadFile(path) {
    try {
        const res = await fetch(`${API_URL}/file?path=${encodeURIComponent(path)}`);
        const data = await res.json();
        if (data.error) {
            fileContentArea.textContent = `Error loading file: ${data.error}`;
        } else {
            fileContentArea.textContent = data.content;
        }
    } catch (err) {
        fileContentArea.textContent = 'Error fetching file content';
    }
}

function showStep(stepName) {
    Object.values(steps).forEach(el => el.classList.remove('active'));
    steps[stepName].classList.add('active');
}

// Event Listeners
document.getElementById('btn-next-step').addEventListener('click', async () => {
    updateStatus('Generating interpretations...', 'busy');
    showStep('analysis');

    const conversation = state.conversations[state.currentIndex];
    const feedback = extractAdvisorFeedback(conversation);
    const studentMessages = conversation.records
        ?.filter(r => r.type === 'message' && r.sender === 'B')
        .map(r => r.content)
        .join('\n\n') || '';

    const enrichedContext = [
        state.currentShortTermMemory,
        state.currentFileContext ? `\n## File Context\n${state.currentFileContext}` : ''
    ].filter(Boolean).join('\n\n');

    try {
        const res = await fetch(`${API_URL}/analyze-feedback`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ feedback, studentMessages, enrichedContext })
        });
        const data = await res.json();
        state.currentKeywordResult = data.keywordResult;
        state.currentDualResult = data.dualResult;

        // Update UI
        document.getElementById('task-level-reasoning').textContent = data.dualResult.taskLevelInterpretation.reasoning;
        document.getElementById('process-level-reasoning').textContent = data.dualResult.processLevelInterpretation.reasoning;

        // Highlight keywords in the conversation area for Advisor messages
        highlightAdvisorMessages(data.keywordResult.keywordPositions);
        
        updateStatus('Select an interpretation', 'idle');
    } catch (err) {
        console.error('Analysis error:', err);
        updateStatus('Error in analysis', 'error');
    }
});

function highlightAdvisorMessages(positions) {
    const advisorMessages = document.querySelectorAll('.message-A .message-content');
    advisorMessages.forEach(msg => {
        const text = msg.innerText;
        let highlightedText = text;
        
        // Sort positions by length descending to handle overlapping keywords
        const sortedKeywords = state.currentKeywordResult.keywords.sort((a, b) => b.length - a.length);
        
        sortedKeywords.forEach(keyword => {
            const regex = new RegExp(`(${escapeRegExp(keyword)})`, 'gi');
            highlightedText = highlightedText.replace(regex, '<span class="keyword-highlight">$1</span>');
        });
        
        msg.innerHTML = highlightedText;
    });
}

function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

document.querySelectorAll('.btn-select').forEach(btn => {
    btn.addEventListener('click', (e) => {
        state.selectedInterpretation = e.target.getAttribute('data-level');
        document.getElementById('selected-level-display').textContent = state.selectedInterpretation;
        showStep('reasoning');
    });
});

document.getElementById('btn-submit-reasoning').addEventListener('click', async () => {
    const userReasoning = document.getElementById('user-reasoning-input').value;
    if (!userReasoning.trim()) {
        alert('Please provide your reasoning.');
        return;
    }

    updateStatus('Checking consistency...', 'busy');
    
    const conversation = state.conversations[state.currentIndex];
    const feedback = extractAdvisorFeedback(conversation);
    const studentMessages = conversation.records
        ?.filter(r => r.type === 'message' && r.sender === 'B')
        .map(r => r.content)
        .join('\n\n') || '';
    
    const enrichedContext = [
        state.currentShortTermMemory,
        state.currentFileContext ? `\n## File Context\n${state.currentFileContext}` : ''
    ].filter(Boolean).join('\n\n');

    try {
        const res = await fetch(`${API_URL}/check-consistency`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userReasoning,
                selectedInterpretation: state.selectedInterpretation,
                feedback,
                studentMessages,
                keywords: state.currentKeywordResult.keywords,
                enrichedContext
            })
        });
        const data = await res.json();
        
        // Update UI
        document.getElementById('consistency-explanation').textContent = data.explanation;
        
        // Highlight reasoning
        let highlightedReasoning = userReasoning;
        const allPhrases = [
            ...(data.supportedText || []).map(p => ({ text: p, supported: true })),
            ...(data.unsupportedText || []).map(p => ({ text: p, supported: false }))
        ].sort((a, b) => b.text.length - a.text.length);

        allPhrases.forEach(phrase => {
            const regex = new RegExp(`(${escapeRegExp(phrase.text)})`, 'gi');
            const className = phrase.supported ? 'supported-text' : 'unsupported-text';
            highlightedReasoning = highlightedReasoning.replace(regex, `<span class="${className}">$1</span>`);
        });

        document.getElementById('evaluated-reasoning').innerHTML = highlightedReasoning;
        showStep('result');
        updateStatus('Consistency check complete', 'idle');
    } catch (err) {
        console.error('Consistency check error:', err);
        updateStatus('Error in consistency check', 'error');
    }
});

document.getElementById('btn-next-conversation').addEventListener('click', () => {
    if (state.currentIndex < state.conversations.length - 1) {
        startConversation(state.currentIndex + 1);
        // Reset inputs
        document.getElementById('user-reasoning-input').value = '';
        document.getElementById('btn-next-step').disabled = true;
    } else {
        alert('All conversations completed!');
    }
});

// Helper functions (extracted from backend logic)
function extractFilePaths(conversation) {
    const filePaths = [];
    if (conversation.records) {
        for (const record of conversation.records) {
            if (record.type === 'file' && record.content) {
                filePaths.push(record.content);
            }
        }
    }
    return filePaths;
}

function extractAdvisorFeedback(conversation) {
    const feedbackMessages = [];
    if (conversation.records) {
        for (const record of conversation.records) {
            if (record.type === 'message' && record.sender === 'A' && record.content) {
                feedbackMessages.push(record.content);
            }
        }
    }
    return feedbackMessages.join('\n\n');
}

// Global scope for onclick
window.loadFile = loadFile;

// Start the app
init();
