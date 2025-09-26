// app.js

// Your existing examples and validator instance
const validator = new YantraBhashaValidator();

const examples = {
    hello: `PADAM message:VARTTAI = "Hello World";
CHATIMPU(message);`,
    addition: `PADAM a:ANKHE;
PADAM b:ANKHE;
PADAM sum:ANKHE = 0;
CHEPPU(a);
CHEPPU(b);
sum = a + b;
CHATIMPU("The Sum is:");
CHATIMPU(sum);`,
    conditional: `PADAM username:VARTTAI;
CHEPPU(username);
ELAITHE (username == "Anirudh") [
CHATIMPU("Welcome Anirudh!");
] ALAITHE [
CHATIMPU("Access Denied!");
]`,
    loop: `PADAM i:ANKHE;
PADAM sum:ANKHE = 0;
MALLI-MALLI (PADAM i:ANKHE = 1; i <= 10; i = i + 1) [
sum = sum + i;
]
CHATIMPU("Sum of first 10 numbers is:");
CHATIMPU(sum);`
};

// Auth state variables
let authToken = localStorage.getItem('authToken') || null;
let authUser = JSON.parse(localStorage.getItem('authUser')) || null;

// Containers
const loginContainer = document.getElementById('loginContainer');
const mainContainer = document.getElementById('main-container');

// Show/hide containers
function showLogin() {
    loginContainer.style.display = 'block';
    mainContainer.style.display = 'none';
}

function showApp() {
    loginContainer.style.display = 'none';
    mainContainer.style.display = 'block';
}

// Handle login form submit
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value.trim();
    const loginError = document.getElementById('loginError');
    loginError.textContent = '';

    try {
        updateStatus('Logging in...', 'info');
        const res = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Invalid credentials');

        authToken = data.token;
        authUser = { username: data.username, role: data.role };
        localStorage.setItem('authToken', authToken);
        localStorage.setItem('authUser', JSON.stringify(authUser));

        updateStatus(`Logged in as ${authUser.username} (${authUser.role})`, 'success');
        showApp();
        renderAppByRole();
    } catch (err) {
        updateStatus('', '');
        loginError.textContent = err.message;
    }
});

// Logout function
function logoutUser() {
    authToken = null;
    authUser = null;
    localStorage.removeItem('authToken');
    localStorage.removeItem('authUser');
    updateStatus('Logged out.', 'info');
    showLogin();
}

// Render UI by role on login
function renderAppByRole() {
    if (!authUser) {
        showLogin();
    } else if (authUser.role === 'student') {
        renderStudentCompiler();
    } else if (authUser.role === 'instructor') {
        renderInstructorDashboard();
    } else {
        showLogin();
    }
}

// STUDENT COMPILER UI render
function renderStudentCompiler() {
    mainContainer.innerHTML = `
        <div class="header">
            <button onclick="logoutUser()" style="float:right">Logout</button>
            <h2>Hello, ${authUser.username} (Student)</h2>
        </div>
        <div class="left-panel">
            <div class="panel-header">📝 Code Editor</div>
            <textarea id="codeEditor" placeholder="// Write your Yantrabhasha code here..."></textarea>
            <button onclick="runCode()">▶️ Run</button>
            <button onclick="loadExample('hello')">Load Hello Example</button>
        </div>
        <div class="right-panel">
            <div class="panel-header">📋 Output & Results</div>
            <div class="stats-bar">
                <div class="stat-item"><span>Lines: </span><span id="lineCount">0</span></div>
                <div class="stat-item"><span>Errors: </span><span id="errorCount">0</span></div>
                <div class="stat-item"><span>Warnings: </span><span id="warningCount">0</span></div>
            </div>
            <div class="output-tabs">
                <div class="tab active" data-tab="validation" onclick="switchTab('validation')">Validation</div>
                <div class="tab" data-tab="variables" onclick="switchTab('variables')">Variables</div>
                <div class="tab" data-tab="console" onclick="switchTab('console')">Console</div>
            </div>
            <div class="output-content">
                <div id="validationOutput" class="tab-content active"></div>
                <div id="variablesOutput" class="tab-content" style="display:none"></div>
                <div id="consoleOutput" class="tab-content" style="display:none"></div>
            </div>
        </div>
    `;
    clearOutputs();
    loadExample('hello');
    switchTab('validation');
}

// Save student submission to backend
async function saveSubmission(code, status, description) {
    if (!authToken) return;
    try {
        await fetch('/api/submissions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-auth-token': authToken
            },
            body: JSON.stringify({ code, status, description }),
        });
    } catch (err) {
        console.error('Failed to save submission:', err);
    }
}

// Run Yantrabhasha code validation and save result
async function runCode() {
    const codeEditor = document.getElementById('codeEditor');
    const code = codeEditor.value.trim();
    updateStatsForCode(code);

    if (code.length === 0) {
        updateStatus('No code entered.', 'error');
        clearOutputs();
        updateStats(0, 0, 0);
        return;
    }

    const result = validator.validate(code);
    renderValidationResults(result.errors, result.warnings);
    renderVariables(result.variables);
    renderConsole(result.console);
    updateStats(code.split('\n').length, result.errors.length, result.warnings.length);

    if (result.errors.length > 0) {
        updateStatus('Validation failed with errors.', 'error');
        await saveSubmission(code, 'error', result.errors.map(e => `Line ${e.line}: ${e.message}`).join(' | '));
    } else if (result.warnings.length > 0) {
        updateStatus('Validation completed with warnings.', 'warning');
        await saveSubmission(code, 'success', 'Warnings: ' + result.warnings.map(e => e.message).join(' | '));
    } else {
        updateStatus('Validation successful! No errors or warnings.', 'success');
        const consoleOutputs = result.console.filter(c => c.type === 'output').map(c => c.value).join(' ');
        await saveSubmission(code, 'success', consoleOutputs);
    }
}

// INSTRUCTOR DASHBOARD UI render
function renderInstructorDashboard() {
    mainContainer.innerHTML = `
        <div class="header">
            <button onclick="logoutUser()" style="float:right">Logout</button>
            <h2>Hello, ${authUser.username} (Instructor)</h2>
        </div>
        <div>
            <label for="studentUsernameInput">Enter Student Username:</label>
            <input type="text" id="studentUsernameInput" placeholder="Student Username" />
            <button onclick="loadStudentSubmissions()">Load Submissions</button>
            <div id="dashboardStatus"></div>
        </div>
        <div id="submissionsList"></div>
    `;
}

async function loadStudentSubmissions() {
    const username = document.getElementById('studentUsernameInput').value.trim();
    const statusEl = document.getElementById('dashboardStatus');
    const listEl = document.getElementById('submissionsList');
    listEl.innerHTML = '';
    statusEl.textContent = '';

    if (!username) {
        statusEl.style.color = 'red';
        statusEl.textContent = 'Please enter a student username.';
        return;
    }

    try {
        statusEl.style.color = 'black';
        statusEl.textContent = 'Loading submissions...';

        const res = await fetch('/api/submissions/' + encodeURIComponent(username), {
            headers: { 'x-auth-token': authToken }
        });

        if (!res.ok) {
            const error = await res.json();
            statusEl.style.color = 'red';
            statusEl.textContent = error.message || 'Failed to load submissions.';
            return;
        }

        const submissions = await res.json();
        if (submissions.length === 0) {
            statusEl.textContent = `No submissions found for user '${username}'.`;
            return;
        }

        statusEl.textContent = `Found ${submissions.length} submissions for '${username}':`;

        submissions.forEach(sub => {
            const div = document.createElement('div');
            div.className = 'submission-item';
            div.style.border = '1px solid #ccc';
            div.style.margin = '10px 0';
            div.style.padding = '10px';
            div.innerHTML = `
                <b>Timestamp:</b> ${new Date(sub.timestamp).toLocaleString()}<br/>
                <b>Status:</b> ${sub.status}<br/>
                <b>Code:</b><pre>${sub.code.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
                <b>Description:</b> <pre>${sub.description.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
            `;
            listEl.appendChild(div);
        });
    } catch (err) {
        statusEl.style.color = 'red';
        statusEl.textContent = 'Error loading submissions.';
        console.error(err);
    }
}

// Existing helpers (updateStatus, updateStats, updateStatsForCode, clearOutputs, renderValidationResults, renderVariables, renderConsole)
// Remain unchanged, copy from your original app.js

function updateStatus(message, statusClass) {
    let statusEl = document.getElementById('status');
    if (!statusEl) {
        statusEl = document.createElement('div');
        statusEl.id = 'status';
        document.body.insertBefore(statusEl, document.body.firstChild);
    }
    statusEl.textContent = message || '';
    statusEl.className = 'status ' + (statusClass || '');
}

function updateStats(lineCount, errorCount, warningCount) {
    const lineCt = document.getElementById('lineCount');
    const errorCt = document.getElementById('errorCount');
    const warnCt = document.getElementById('warningCount');
    if (lineCt) lineCt.textContent = lineCount;
    if (errorCt) errorCt.textContent = errorCount;
    if (warnCt) warnCt.textContent = warningCount;
}

function updateStatsForCode(code) {
    const lines = code.split('\n').length;
    updateStats(lines, 0, 0);
}

function clearOutputs() {
    const valOut = document.getElementById('validationOutput');
    const varOut = document.getElementById('variablesOutput');
    const conOut = document.getElementById('consoleOutput');
    if (valOut) valOut.innerHTML = '';
    if (varOut) varOut.innerHTML = '';
    if (conOut) conOut.innerHTML = '';
}

// Use your existing rendering functions for validation, variables, console here (no change).

// On window load, show login or app depending on saved token
window.onload = () => {
    if (authUser && authToken) {
        showApp();
        renderAppByRole();
    } else {
        showLogin();
    }
};

// Show login UI if not logged in
function showLogin() {
    loginContainer.style.display = 'block';
    mainContainer.style.display = 'none';
}

// Show main app UI if logged in
function showApp() {
    loginContainer.style.display = 'none';
    mainContainer.style.display = 'block';
}
