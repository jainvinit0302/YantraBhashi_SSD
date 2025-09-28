// File: app.js

const examples = {
    hello: `PADAM message:VARTTAI = "Hello World";\nCHATIMPU(message);`,
    addition: `PADAM a:ANKHE;\nPADAM b:ANKHE;\nPADAM sum:ANKHE = 0;\nCHEPPU(a);\nCHEPPU(b);\nsum = a + b;\nCHATIMPU("The Sum is:");\nCHATIMPU(sum);`,
    conditional: `PADAM username:VARTTAI;\nCHEPPU(username);\nELAITHE (username == "Anirudh") [\nCHATIMPU("Welcome Anirudh!");\n] ALAITHE [\nCHATIMPU("Access Denied!");\n]`,
    loop: `PADAM sum:ANKHE=0;\nMALLI-MALLI (PADAM i:ANKHE = 1; i <= 10; i = i + 1) [\nsum = sum + i;\n]\nCHATIMPU("Sum of first 10 numbers is:");\nCHATIMPU(sum);`
};

function toggleExamples() {
    document.getElementById('examplesMenu').classList.toggle('show');
}

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

function updateStatus(message, statusClass) {
    const statusEl = document.getElementById('status');
    statusEl.textContent = message;
    statusEl.className = 'status ' + (statusClass || '');
}

function updateStats(lineCount, errorCount, warningCount) {
    document.getElementById('lineCount').textContent = lineCount;
    document.getElementById('errorCount').textContent = errorCount;
    document.getElementById('warningCount').textContent = warningCount;
}

function updateStatsForCode(code) {
    const lines = code.split('\n').filter(Boolean).length;
    updateStats(lines, 0, 0);
}

function clearOutputs() {
    document.getElementById('validationOutput').innerHTML = '';
    document.getElementById('variablesOutput').innerHTML = '';
    document.getElementById('consoleOutput').innerHTML = '';
}

function switchTab(tabName) {
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.tab === tabName);
    });
    document.querySelectorAll('.tab-content').forEach(content => {
        content.style.display = content.id.startsWith(tabName) ? 'block' : 'none';
    });
}

function renderValidationResults(errors, warnings) {
    const outputEl = document.getElementById('validationOutput');
    outputEl.innerHTML = '';
    if (errors.length === 0 && warnings.length === 0) {
        const successMsg = document.createElement('div');
        successMsg.className = 'output-line success';
        successMsg.textContent = 'No validation errors or warnings found.';
        outputEl.appendChild(successMsg);
        return;
    }
    errors.forEach(err => {
        const errDiv = document.createElement('div');
        errDiv.className = 'output-line error';
        errDiv.textContent = `Line ${err.line}: ${err.message}`;
        outputEl.appendChild(errDiv);
    });
}

function renderVariables(variables) {
    const outputEl = document.getElementById('variablesOutput');
    outputEl.innerHTML = '';
    const infoDiv = document.createElement('div');
    infoDiv.className = 'output-line info';
    infoDiv.textContent = 'Variable tracking is not implemented in this version.';
    outputEl.appendChild(infoDiv);
}

function renderConsole(outputLines) {
    const outputEl = document.getElementById('consoleOutput');
    outputEl.innerHTML = '';
    if (!outputLines || outputLines.length === 0) {
        const infoDiv = document.createElement('div');
        infoDiv.className = 'output-line info';
        infoDiv.textContent = 'No console output from execution.';
        outputEl.appendChild(infoDiv);
        return;
    }
    outputLines.forEach(line => {
        const msgDiv = document.createElement('div');
        msgDiv.className = 'output-line success';
        msgDiv.textContent = String(line);
        outputEl.appendChild(msgDiv);
    });
}

function runCode() {
    const codeEditor = document.getElementById('codeEditor');
    const code = codeEditor.value;

    clearOutputs();
    updateStatsForCode(code);
    if (code.trim().length === 0) { updateStatus('No code entered.', 'error'); return; }

    const pipedCode = code.split('\n').map(line => line.trim()).filter(Boolean).join('|');
    const validationResult = validateCode(pipedCode);

    renderValidationResults(validationResult.errors, []);
    renderVariables([]); // Not implemented
    updateStats(code.split('\n').filter(Boolean).length, validationResult.errors.length, 0);

    if (!validationResult.isValid) {
        updateStatus('Validation failed! Cannot execute.', 'error');
        switchTab('validation');
        return;
    }

    updateStatus('Validation successful. Running code...', 'success');
    try {
        const inputs = []; // For now, inputs are empty.
        const interpreter = new YantrabhashaInterpreter();
        const executionResult = interpreter.run(code, inputs);

        renderConsole(executionResult.output);

        if (executionResult.success) {
            updateStatus('Execution finished successfully!', 'success');
        } else {
            const runtimeError = { line: 'Runtime', message: executionResult.error };
            renderValidationResults([runtimeError], []);
            updateStatus('A runtime error occurred!', 'error');
            updateStats(code.split('\n').filter(Boolean).length, 1, 0);
        }
        switchTab('console');
    } catch (e) {
        updateStatus(`Interpreter crashed: ${e.message}`, 'error');
        const crashError = { line: 'Crash', message: e.message };
        renderValidationResults([crashError], []);
        switchTab('validation');
    }
}

function init() {
    document.addEventListener('click', (event) => {
        const menu = document.getElementById('examplesMenu');
        const button = document.querySelector('.examples-btn');
        if (menu && button && !menu.contains(event.target) && !button.contains(event.target)) {
            menu.classList.remove('show');
        }
    });
    loadExample('hello');
    switchTab('validation');
}

window.onload = init;