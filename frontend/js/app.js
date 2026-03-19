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
    analysisTrigger: document.getElementById('interaction-step-analysis-trigger'),
    analysis: document.getElementById('interaction-step-analysis'),
    reasoning: document.getElementById('interaction-step-reasoning'),
    result: document.getElementById('interaction-step-result')
};

// Resizer logic
const resizer = document.getElementById('resizer');
const leftPanel = document.getElementById('left-panel');
let isResizing = false;

resizer.addEventListener('mousedown', (e) => {
    isResizing = true;
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', () => {
        isResizing = false;
        document.removeEventListener('mousemove', handleMouseMove);
    });
});

function handleMouseMove(e) {
    if (!isResizing) return;
    const newWidth = (e.clientX / window.innerWidth) * 100;
    if (newWidth > 10 && newWidth < 90) {
        leftPanel.style.width = `${newWidth}%`;
    }
}

// Initialize
async function init() {
    try {
        updateStatus('Initializing session...', 'busy');
        
        // Initialize session (backup and clear)
        await fetch(`${API_URL}/init-session`, { method: 'POST' });

        // Get project info
        const projectRes = await fetch(`${API_URL}/project`);
        state.project = await projectRes.json();
        projectNameEl.textContent = `Project: ${state.project.name}`;

        // Get conversations (now reads from backup)
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
    // Reset reasoning input
    const reasoningInput = document.getElementById('user-reasoning-input');
    if (reasoningInput) reasoningInput.value = '';
    
    showStep('analysisTrigger');
    document.getElementById('btn-start-analysis').disabled = true;
    updateStatus(`Processing Conversation ${index + 1}/${state.conversations.length}`, 'busy');

    // Display all messages in the conversation area
    renderConversation(conversation);

    // Step A: Process Memory (Run in background, no UI display)
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
        
        // Step B: Get File Context (Run in background)
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

        document.getElementById('btn-start-analysis').disabled = false;
        updateStatus('Ready for analysis', 'idle');
    } catch (err) {
        console.error('Background processing error:', err);
        updateStatus('Error in background processing', 'error');
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
        } else if (record.type === 'file') {
            const fileEl = document.createElement('div');
            fileEl.className = 'message message-file';
            fileEl.innerHTML = `<span class="sender-name">System</span><div class="message-content">File attached: <span class="file-link" onclick="loadFile('${record.content}')">${record.content}</span></div>`;
            conversationArea.appendChild(fileEl);
        }
    });
}

async function loadFile(path) {
    const isPdf = path.toLowerCase().endsWith('.pdf');
    if (isPdf) {
        const url = `${API_URL}/file?path=${encodeURIComponent(path)}`;
        fileContentArea.innerHTML = `<iframe class="pdf-viewer" src="${url}"></iframe>`;
    } else {
        try {
            const res = await fetch(`${API_URL}/file?path=${encodeURIComponent(path)}`);
            const data = await res.json();
            if (data.error) {
                fileContentArea.textContent = `Error loading file: ${data.error}`;
            } else {
                fileContentArea.innerHTML = `<pre class="content-area">${data.content}</pre>`;
            }
        } catch (err) {
            fileContentArea.textContent = 'Error fetching file content';
        }
    }
}

function showStep(stepName) {
    Object.values(steps).forEach(el => el.classList.remove('active'));
    steps[stepName].classList.add('active');
}

// Event Listeners
document.getElementById('btn-start-analysis').addEventListener('click', async () => {
    updateStatus('Generating interpretations...', 'busy');
    showStep('analysis');

    const conversation = state.conversations[state.currentIndex];
    const feedback = extractAdvisorFeedback(conversation);
    const studentMessages = conversation.records
        ?.filter(r => r.type === 'message' && r.sender === 'B')
        .map(r => r.content)
        .join('\n\n') || '';

    // enrichedContext used in backend
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
    const resultDisplay = document.getElementById('evaluated-reasoning');
    resultDisplay.innerHTML = '<div class="loading-spinner">Analyzing your reasoning with LLM...</div>';
    
    try {
        const response = await fetch(`${API_URL}/check-consistency`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userReasoning,
                selectedInterpretation: state.selectedInterpretation,
                feedback: extractAdvisorFeedback(state.conversations[state.currentIndex]),
                studentMessages: state.conversations[state.currentIndex].records
                    ?.filter(r => r.type === 'message' && r.sender === 'B')
                    .map(r => r.content)
                    .join('\n\n') || '',
                keywords: state.currentKeywordResult?.keywordPositions.map(k => k.keyword) || [],
                enrichedContext: state.currentShortTermMemory + (state.currentFileContext ? `\n\n## File Context\n${state.currentFileContext}` : '')
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('[Frontend] Consistency API raw response:', data);
        
        // UI ONLY shows the highlighted result, not the explanation
        // Fallback to original reasoning if highlightedReasoning is missing
        const resultHtml = data.highlightedReasoning || userReasoning || 'No results returned';
        console.log('[Frontend] Final HTML to render:', resultHtml);
        resultDisplay.innerHTML = resultHtml;
        
        showStep('result');
        updateStatus('Check complete', 'idle');
    } catch (err) {
        console.error('Consistency check error:', err);
        resultDisplay.innerHTML = `<div class="error-text">Error checking consistency: ${err.message}</div>`;
        updateStatus('Error in consistency check', 'error');
    }
});

document.getElementById('btn-next-conversation').addEventListener('click', () => {
    if (state.currentIndex < state.conversations.length - 1) {
        startConversation(state.currentIndex + 1);
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
