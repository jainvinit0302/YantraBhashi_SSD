// app.js

// Assume YantraBhashaValidator class and validator.js is loaded before this script

// Global reference to the validator instance
const validator = new YantraBhashaValidator();

// Example code snippets for the dropdown loader
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

// Toggle the examples dropdown menu visibility
function toggleExamples() {
    const menu = document.getElementById('examplesMenu');
    menu.classList.toggle('show');
}

// Load selected example code into the editor
function loadExample(name) {
    const codeEditor = document.getElementById('codeEditor');
    if (examples[name]) {
        codeEditor.value = examples[name];
        updateStatus(`Loaded example: ${name}`, 'success');
        toggleExamples();
        updateStatsForCode(codeEditor.value);
        clearOutputs();
    } else {
        updateStatus(`Example "${name}" not found`, 'error');
    }
}

// Update status message and style
function updateStatus(message, statusClass) {
    const statusEl = document.getElementById('status');
    statusEl.textContent = message;
    statusEl.className = 'status ' + (statusClass || '');
}

// Update line, error, and warning counts in the UI
function updateStats(lineCount, errorCount, warningCount) {
    document.getElementById('lineCount').textContent = lineCount;
    document.getElementById('errorCount').textContent = errorCount;
    document.getElementById('warningCount').textContent = warningCount;
}

// Helper to update stats for given code string
function updateStatsForCode(code) {
    const lines = code.split('\n').length;
    // Errors and warnings not calculated here; call after validation
    updateStats(lines, 0, 0);
}

// Clear previous outputs on validation screen
function clearOutputs() {
    document.getElementById('validationOutput').innerHTML = '';
    document.getElementById('variablesOutput').innerHTML = '';
    document.getElementById('consoleOutput').innerHTML = '';
}

// Switch between output tabs: validation, variables, console
function switchTab(tabName) {
    const tabs = document.querySelectorAll('.tab');
    const contents = document.querySelectorAll('.tab-content');
    tabs.forEach(tab => {
        tab.classList.toggle('active', tab.dataset.tab === tabName);
    });
    contents.forEach(content => {
        if (content.id === `${tabName}Output`) {
            content.style.display = 'block';
            content.classList.add('active');
        } else {
            content.style.display = 'none';
            content.classList.remove('active');
        }
    });
}

// Render the validation errors and warnings in Validation tab
function renderValidationResults(errors, warnings) {
    const outputEl = document.getElementById('validationOutput');
    outputEl.innerHTML = '';

    if (errors.length === 0 && warnings.length === 0) {
        const successMsg = document.createElement('div');
        successMsg.className = 'output-line success';
        successMsg.textContent = 'No errors or warnings found. Code is valid!';
        outputEl.appendChild(successMsg);
        return;
    }

    errors.forEach(err => {
        const errDiv = document.createElement('div');
        errDiv.className = 'output-line error';
        errDiv.textContent = `Line ${err.line}: ${err.message}`;
        outputEl.appendChild(errDiv);
    });

    warnings.forEach(warn => {
        const warnDiv = document.createElement('div');
        warnDiv.className = 'output-line warning';
        warnDiv.textContent = `Line ${warn.line}: ${warn.message}`;
        outputEl.appendChild(warnDiv);
    });
}

// Render declared variables in Variables tab
function renderVariables(variables) {
    const outputEl = document.getElementById('variablesOutput');
    outputEl.innerHTML = '';

    if (variables.length === 0) {
        const infoDiv = document.createElement('div');
        infoDiv.className = 'output-line info';
        infoDiv.textContent = 'No variables declared.';
        outputEl.appendChild(infoDiv);
        return;
    }

    const varList = document.createElement('div');
    varList.className = 'variables-list';

    const header = document.createElement('h4');
    header.textContent = 'Declared Variables';
    varList.appendChild(header);

    variables.forEach(([name, type]) => {
        const varItem = document.createElement('div');
        varItem.className = 'variable-item';

        const varName = document.createElement('span');
        varName.className = 'variable-name';
        varName.textContent = name;

        const varType = document.createElement('span');
        varType.className = 'variable-type';
        varType.textContent = type;

        varItem.appendChild(varName);
        varItem.appendChild(varType);
        varList.appendChild(varItem);
    });

    outputEl.appendChild(varList);
}

// Render console output (print and input prompts) in Console tab
function renderConsole(consoleMsgs) {
    const outputEl = document.getElementById('consoleOutput');
    outputEl.innerHTML = '';

    if (consoleMsgs.length === 0) {
        const infoDiv = document.createElement('div');
        infoDiv.className = 'output-line info';
        infoDiv.textContent = 'No console output.';
        outputEl.appendChild(infoDiv);
        return;
    }

    consoleMsgs.forEach(msg => {
        const msgDiv = document.createElement('div');
        msgDiv.className = 'output-line';

        // Style output or input differently
        if (msg.type === 'output') {
            msgDiv.classList.add('success');
            msgDiv.textContent = `Output (Line ${msg.line}): ${msg.value}`;
        } else if (msg.type === 'input') {
            msgDiv.classList.add('info');
            msgDiv.textContent = `Input required (Line ${msg.line}): ${msg.value}`;
        } else {
            msgDiv.textContent = msg.value;
        }
        outputEl.appendChild(msgDiv);
    });
}

// Called when Run button clicked
function runCode() {
    const codeEditor = document.getElementById('codeEditor');
    const code = codeEditor.value.trim();

    // Basic line count update
    updateStatsForCode(code);

    if (code.length === 0) {
        updateStatus('No code entered.', 'error');
        clearOutputs();
        updateStats(0, 0, 0);
        return;
    }

    // Run validation
    const result = validator.validate(code);

    // Update UI for errors and warnings
    renderValidationResults(result.errors, result.warnings);

    // Update Variables tab
    renderVariables(result.variables);

    // Update Console tab output
    renderConsole(result.console);

    // Update counts box for errors/warnings
    updateStats(
        code.split('\n').length,
        result.errors.length,
        result.warnings.length
    );

    if (result.errors.length > 0) {
        updateStatus('Validation failed with errors.', 'error');
    } else if (result.warnings.length > 0) {
        updateStatus('Validation completed with warnings.', 'warning');
    } else {
        updateStatus('Validation successful! No errors or warnings.', 'success');
    }
}

// Initialize event listeners and default states when page loads
function init() {
    // Hide examples menu if clicking outside
    document.addEventListener('click', (event) => {
        const menu = document.getElementById('examplesMenu');
        const button = document.querySelector('.examples-btn');
        if (!menu.contains(event.target) && !button.contains(event.target)) {
            menu.classList.remove('show');
        }
    });

    // Load default example (optional)
    loadExample('hello');

    // Show Validation tab by default
    switchTab('validation');
}

// Run init on page load
window.onload = init;
