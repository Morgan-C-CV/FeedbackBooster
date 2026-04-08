const API_URL = 'http://localhost:3001/api';

// State management
let state = {
    userId: '',
    isAgentAssist: true,
    project: null,
    conversations: [],
    currentIndex: 0,
    currentShortTermMemory: '',
    currentDualResult: null,
    currentKeywordResult: null,
    selectedInterpretation: '',
    currentFileContext: '',
    finalSelection: '',
    confidenceScore: 0
};

// DOM Elements
const projectNameEl = document.getElementById('project-name');
const conversationArea = document.getElementById('conversation-area');
const fileContentArea = document.getElementById('file-content');
const statusIndicator = document.getElementById('status-indicator');
const setupOverlay = document.getElementById('setup-overlay');
const analysisTriggerHintEl = document.getElementById('analysis-trigger-hint');
const analysisTriggerMessageEl = document.getElementById('analysis-trigger-message');

// Interaction steps
const steps = {
    analysisTrigger: document.getElementById('interaction-step-analysis-trigger'),
    analysis: document.getElementById('interaction-step-analysis'),
    reasoning: document.getElementById('interaction-step-reasoning'),
    result: document.getElementById('interaction-step-result'),
    final: document.getElementById('interaction-step-final'),
    next: document.getElementById('interaction-step-next')
};

// Resizer logic
const resizer = document.getElementById('resizer');
const leftPanel = document.getElementById('left-panel');
let isResizing = false;

if (resizer) {
    resizer.addEventListener('mousedown', (e) => {
        isResizing = true;
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', () => {
            isResizing = false;
            document.removeEventListener('mousemove', handleMouseMove);
        });
    });
}

function handleMouseMove(e) {
    if (!isResizing) return;
    const newWidth = (e.clientX / window.innerWidth) * 100;
    if (newWidth > 10 && newWidth < 90) {
        leftPanel.style.width = `${newWidth}%`;
    }
}

// Setup Event Listeners
document.getElementById('btn-setup-start').addEventListener('click', () => {
    const userIdInput = document.getElementById('user-id').value.trim();
    if (!userIdInput) {
        alert('Please enter a Tester Number.');
        return;
    }
    
    state.userId = userIdInput;
    state.isAgentAssist = document.getElementById('agent-assist-toggle').checked;
    
    // Apply mode to body for CSS targeting
    if (state.isAgentAssist) {
        document.body.classList.add('mode-assist');
    } else {
        document.body.classList.remove('mode-assist');
    }
    
    setupOverlay.style.display = 'none';
    console.log(`[Setup] User: ${state.userId}, Assist: ${state.isAgentAssist}`);
    init();
});

// Initialize
async function init() {
    try {
        updateStatus('Selecting random project...', 'busy');
        
        // 1. Get a random project ID from backend
        const randomRes = await fetch(`${API_URL}/random-project`);
        if (!randomRes.ok) throw new Error('Failed to get random project');
        const { projectId } = await randomRes.json();

        updateStatus(`Initializing ${projectId}...`, 'busy');
        
        // 2. Initialize session
        const initRes = await fetch(`${API_URL}/init-session`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ projectId })
        });
        if (!initRes.ok) throw new Error('Failed to initialize session');

        // 3. Get project info
        const projectRes = await fetch(`${API_URL}/project?projectId=${projectId}`);
        if (!projectRes.ok) throw new Error('Failed to get project info');
        state.project = await projectRes.json();
        projectNameEl.textContent = `Project: ${state.project.name || 'Unknown'}`;

        // 4. Get conversations
        const convRes = await fetch(`${API_URL}/conversations?projectId=${projectId}`);
        if (!convRes.ok) throw new Error('Failed to get conversations');
        state.conversations = await convRes.json() || [];
        
        if (state.conversations.length > 0) {
            startConversation(0);
        } else {
            updateStatus('No conversations found', 'error');
        }
    } catch (err) {
        console.error('Initialization error:', err);
        updateStatus('Initialization failed', 'error');
    }
}

function updateStatus(text, type = 'idle') {
    statusIndicator.textContent = text;
    statusIndicator.className = `status-indicator status-${type}`;
}

function setAnalysisTriggerMessage(text) {
    if (analysisTriggerMessageEl) analysisTriggerMessageEl.textContent = text;
}

function setAnalysisTriggerLoading(isLoading) {
    if (!analysisTriggerHintEl) return;
    analysisTriggerHintEl.classList.toggle('is-loading', isLoading);
}

function createInlineLoadingText(text) {
    return `<span class="inline-loading"><span class="inline-spinner" aria-hidden="true"></span><span>${text}</span></span>`;
}

async function startConversation(index) {
    state.currentIndex = index;
    state.finalSelection = '';
    state.confidenceScore = 0;
    state.selectedInterpretation = '';
    
    const conversation = state.conversations[index];
    conversationArea.innerHTML = '';
    
    // Reset inputs
    const reasoningInput = document.getElementById('user-reasoning-input');
    if (reasoningInput) reasoningInput.value = '';
    
    // Reset final step UI
    document.querySelectorAll('input[name="final-level"]').forEach(rb => rb.checked = false);
    document.querySelectorAll('.btn-score').forEach(btn => btn.classList.remove('selected'));
    document.getElementById('btn-submit-final-result').disabled = true;

    renderConversation(conversation);

    if (state.isAgentAssist) {
        showStep('analysisTrigger');
        document.getElementById('btn-start-analysis').disabled = true;
        setAnalysisTriggerLoading(true);
        updateStatus(`Loading round ${index + 1}/${state.conversations.length} context...`, 'busy');
        setAnalysisTriggerMessage(`Loading Round ${index + 1}/${state.conversations.length} context... You can review the conversation and files to gather the necessary information.`);

        try {
            updateStatus('Building memory context...', 'busy');
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
            
            const filePaths = extractFilePaths(conversation);
            updateStatus('Retrieving linked file context...', 'busy');
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
            setAnalysisTriggerLoading(false);
            setAnalysisTriggerMessage('Round context is ready. Click Start Analysis when you are ready.');
            updateStatus('Round context is ready', 'idle');
        } catch (err) {
            console.error('Background processing error:', err);
            setAnalysisTriggerLoading(false);
            setAnalysisTriggerMessage('Failed to load round context. Please refresh and try again.');
            updateStatus('Error while loading context', 'error');
        }
    } else {
        // Manual Mode: Skip to Final Step immediately
        updateStatus('Review conversation then make your decision', 'idle');
        showStep('final');
    }
}

function renderConversation(conversation) {
    conversation.records.forEach(record => {
        const msgEl = document.createElement('div');
        if (record.type === 'message') {
            msgEl.className = `message message-${record.sender}`;
            const senderName = conversation.participants?.[record.sender] || record.sender;
            let content = record.content || '';
            content = content.replace(/(\/[^\s]+\.[a-zA-Z0-9]+)/g, (match) => {
                return `<span class="file-link" onclick="loadFile('${match}')">${match}</span>`;
            });
            msgEl.innerHTML = `<span class="sender-name">${senderName}</span><div class="message-content">${content}</div>`;
        } else if (record.type === 'file') {
            msgEl.className = 'message message-file';
            msgEl.innerHTML = `<span class="sender-name">System</span><div class="message-content">File attached: <span class="file-link" onclick="loadFile('${record.content}')">${record.content}</span></div>`;
        }
        conversationArea.appendChild(msgEl);
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
            fileContentArea.innerHTML = data.error ? `Error: ${data.error}` : `<pre class="content-area">${data.content}</pre>`;
        } catch (err) {
            fileContentArea.textContent = 'Error fetching file content';
        }
    }
}

function showStep(stepName) {
    Object.values(steps).forEach(el => {
        if (el) el.classList.remove('active');
    });
    if (steps[stepName]) steps[stepName].classList.add('active');
}

// Event Listeners for Steps
document.getElementById('btn-start-analysis').addEventListener('click', async () => {
    updateStatus('Preparing interpretation request...', 'busy');
    document.getElementById('task-level-reasoning').innerHTML = createInlineLoadingText('Generating task-level interpretation...');
    document.getElementById('process-level-reasoning').innerHTML = createInlineLoadingText('Generating process-level interpretation...');
    showStep('analysis');

    const conversation = state.conversations[state.currentIndex];
    const feedback = extractAdvisorFeedback(conversation);
    const studentMessages = conversation.records
        ?.filter(r => r.type === 'message' && r.sender === 'B')
        .map(r => r.content).join('\n\n') || '';

    const enrichedContext = [
        state.currentShortTermMemory,
        state.currentFileContext ? `\n## File Context\n${state.currentFileContext}` : ''
    ].filter(Boolean).join('\n\n');

    try {
        updateStatus('Analyzing feedback and generating dual interpretations...', 'busy');
        const res = await fetch(`${API_URL}/analyze-feedback`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ feedback, studentMessages, enrichedContext })
        });
        const data = await res.json();
        state.currentKeywordResult = data.keywordResult;
        state.currentDualResult = data.dualResult;

        updateStatus('Rendering interpretation results...', 'busy');
        document.getElementById('task-level-reasoning').textContent = data.dualResult.taskLevelInterpretation.reasoning;
        document.getElementById('process-level-reasoning').textContent = data.dualResult.processLevelInterpretation.reasoning;
        highlightAdvisorMessages(data.keywordResult.keywordPositions);
        
        updateStatus('Interpretations are ready. Select the primary factor.', 'idle');
    } catch (err) {
        document.getElementById('task-level-reasoning').textContent = 'Failed to generate interpretation.';
        document.getElementById('process-level-reasoning').textContent = 'Failed to generate interpretation.';
        updateStatus('Error during interpretation generation', 'error');
    }
});

function highlightAdvisorMessages() {
    const advisorMessages = document.querySelectorAll('.message-A .message-content');
    const keywords = state.currentKeywordResult.keywords.sort((a, b) => b.length - a.length);
    
    advisorMessages.forEach(msg => {
        let highlightedText = msg.innerText;
        keywords.forEach(keyword => {
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
    const userReasoning = document.getElementById('user-reasoning-input').value.trim();
    if (!userReasoning) return alert('Please provide your reasoning.');

    updateStatus('Checking consistency...', 'busy');
    const resultDisplay = document.getElementById('evaluated-reasoning');
    resultDisplay.innerHTML = '<div class="loading-spinner">Analyzing with AI...</div>';
    
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
                    .map(r => r.content).join('\n\n') || '',
                keywords: state.currentKeywordResult?.keywords || [],
                enrichedContext: state.currentShortTermMemory + (state.currentFileContext ? `\n\n## File Context\n${state.currentFileContext}` : '')
            })
        });
        const data = await response.json();
        resultDisplay.innerHTML = data.highlightedReasoning || userReasoning;
        showStep('result');
        updateStatus('Review AI check', 'idle');
    } catch (err) {
        updateStatus('Error in consistency check', 'error');
    }
});

document.getElementById('btn-go-to-final').addEventListener('click', () => {
    showStep('final');
});

// Final Step Logic
document.getElementById('final-choice-group').addEventListener('change', (e) => {
    state.finalSelection = e.target.value;
    validateFinalStep();
});

document.getElementById('score-buttons').addEventListener('click', (e) => {
    if (e.target.classList.contains('btn-score')) {
        document.querySelectorAll('.btn-score').forEach(b => b.classList.remove('selected'));
        e.target.classList.add('selected');
        state.confidenceScore = parseInt(e.target.getAttribute('data-score'));
        validateFinalStep();
    }
});

function validateFinalStep() {
    const btn = document.getElementById('btn-submit-final-result');
    btn.disabled = !(state.finalSelection && state.confidenceScore > 0);
}

document.getElementById('btn-submit-final-result').addEventListener('click', async () => {
    updateStatus('Saving results...', 'busy');
    try {
        const conversation = state.conversations[state.currentIndex];
        const res = await fetch(`${API_URL}/save-results`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: state.userId,
                projectId: state.project.name,
                conversationId: conversation.conversation_id,
                mode: state.isAgentAssist ? 'Agent-Assist' : 'Manual',
                finalSelection: state.finalSelection,
                confidence: state.confidenceScore,
                reasoning: document.getElementById('user-reasoning-input').value.trim()
            })
        });
        if (!res.ok) throw new Error('Save failed');
        showStep('next');
        updateStatus('Success', 'idle');
    } catch (err) {
        updateStatus('Failed to save results', 'error');
    }
});

document.getElementById('btn-next-conversation').addEventListener('click', () => {
    if (state.currentIndex < state.conversations.length - 1) {
        startConversation(state.currentIndex + 1);
    } else {
        alert('All rounds for this project are completed. Refresh to try another project.');
    }
});

// Helpers
function extractFilePaths(conversation) {
    return (conversation.records || []).filter(r => r.type === 'file').map(r => r.content);
}

function extractAdvisorFeedback(conversation) {
    return (conversation.records || []).filter(r => r.type === 'message' && r.sender === 'A').map(r => r.content).join('\n\n');
}

window.loadFile = loadFile;
// Note: init() is called by btn-setup-start listener
