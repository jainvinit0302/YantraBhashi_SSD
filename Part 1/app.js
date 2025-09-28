// app.js (replace your existing file)
const validator = new YantraBhashaValidator();

// UI helpers (same names as your app)
function toggleExamples() {
  const menu = document.getElementById('examplesMenu');
  menu.classList.toggle('show');
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
  const lines = code.split('\n').length;
  updateStats(lines, 0, 0);
}

function clearOutputs() {
  document.getElementById('validationOutput').innerHTML = '';
  document.getElementById('variablesOutput').innerHTML = '';
  document.getElementById('consoleOutput').innerHTML = '';
}

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
    errDiv.textContent = `Line ${err.line || '?'}: ${err.message}`;
    outputEl.appendChild(errDiv);
  });
  warnings.forEach(warn => {
    const warnDiv = document.createElement('div');
    warnDiv.className = 'output-line warning';
    warnDiv.textContent = `Line ${warn.line || '?'}: ${warn.message}`;
    outputEl.appendChild(warnDiv);
  });
}

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
  variables.forEach(([name, type, value]) => {
    const varItem = document.createElement('div');
    varItem.className = 'variable-item';
    const varName = document.createElement('span');
    varName.className = 'variable-name';
    varName.textContent = name;
    const varType = document.createElement('span');
    varType.className = 'variable-type';
    varType.textContent = `${type}${value !== undefined ? ' = ' + value : ''}`;
    varItem.appendChild(varName);
    varItem.appendChild(varType);
    varList.appendChild(varItem);
  });
  outputEl.appendChild(varList);
}

// renderConsole: respects message.type === 'error' to style red
function renderConsole(consoleMsgs) {
  const outputEl = document.getElementById('consoleOutput');
  outputEl.innerHTML = '';

  if (!consoleMsgs || consoleMsgs.length === 0) {
    const infoDiv = document.createElement('div');
    infoDiv.className = 'output-line info';
    infoDiv.textContent = 'No console output.';
    outputEl.appendChild(infoDiv);
    return;
  }

  consoleMsgs.forEach(msg => {
    const msgDiv = document.createElement('div');
    msgDiv.className = 'output-line';

    if (msg.type === 'output') {
      msgDiv.classList.add('success');
      msgDiv.textContent = `Output (line ${msg.line || '?'}) : ${msg.value}`;
    } else if (msg.type === 'input') {
      msgDiv.classList.add('info');
      msgDiv.textContent = `Input requested (line ${msg.line || '?'}) : ${msg.value}`;
    } else if (msg.type === 'error') {
      msgDiv.classList.add('error');
      msgDiv.textContent = `Execution Failed: ${msg.value}`;
    } else {
      msgDiv.textContent = msg.value;
    }

    outputEl.appendChild(msgDiv);
  });
}

// runInterpreterCapture: captures console.log & console.error separately
function runInterpreterCapture(programString, inputs = []) {
  const originalLog = console.log;
  const originalError = console.error;
  const captured = [];

  console.log = function (...args) {
    captured.push({ type: 'output', value: args.join(' '), line: null });
    originalLog.apply(console, args);
  };
  console.error = function (...args) {
    captured.push({ type: 'error', value: args.join(' '), line: null });
    originalError.apply(console, args);
  };

  try {
    runInterpreter(programString, inputs);
  } catch (e) {
    captured.push({ type: 'error', value: `Runtime error: ${e.message}`, line: null });
  } finally {
    console.log = originalLog;
    console.error = originalError;
  }

  return captured;
}

// find all CHEPPU occurrences to prompt user for inputs (in order)
function gatherInputsForProgram(programString) {
  const lines = programString.replace(/\r\n/g, '\n').split('\n');
  const prompts = [];
  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    const m = trimmed.match(/^\s*CHEPPU\s*\(\s*([a-zA-Z_]\w*)\s*\)\s*;\s*$/);
    if (m) {
      prompts.push({ line: i + 1, varName: m[1] });
    }
  }
  // Ask user for values sequentially
  const inputs = [];
  for (const p of prompts) {
    const answer = window.prompt(`Input for variable '${p.varName}' (line ${p.line}):`);
    inputs.push(answer === null ? '' : answer);
  }
  return inputs;
}

// ---------- Run button handler ----------
function runCode() {
  const codeEditor = document.getElementById('codeEditor');
  const code = codeEditor.value;

  updateStatsForCode(code);
  clearOutputs();

  if (!code || code.trim().length === 0) {
    updateStatus('No code entered.', 'error');
    updateStats(0, 0, 0);
    return;
  }

  // Run validation
  const result = validate(code);

  // Show validation results and variables immediately
  renderValidationResults(result.errors, result.warnings);
  renderVariables(result.variables.map(([n, t]) => [n, t, result.variableValues?.[n]] || [n, t]));
  updateStats(code.split('\n').length, result.errors.length, result.warnings.length);

  // If there are validation errors, stop here and DO NOT show console outputs or run interpreter
  if (result.errors.length > 0) {
    updateStatus('Validation failed with errors.', 'error');
    // Optionally clear Console tab so it doesn't show validator's simulated outputs
    document.getElementById('consoleOutput').innerHTML = '';
    // show Validation tab to make errors prominent
    switchTab('validation');
    return;
  }

  // No validation errors -> show validator console (optional) and then run interpreter
  // If you prefer to not show validator's simulated console at all, omit the next line.
  renderConsole(result.console);

  if (result.warnings.length > 0) {
    updateStatus('Validation completed with warnings.', 'warning');
  } else {
    updateStatus('Validation successful! Running program...', 'success');
  }

  // Ask for inputs required by CHEPPU in program
  const inputs = gatherInputsForProgram(code);

  // Run interpreter and capture runtime output / errors
  const outputs = runInterpreterCapture(code, inputs);

  // Render interpreter outputs in Console tab and switch to it
  renderConsole(outputs);
  switchTab('console');
  updateStatus('Execution finished (see Console).', 'success');
}


// ---------- examples object you already had (keeps dropdown working) ----------
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

// Init code (keeps behavior same as before)
function init() {
  document.addEventListener('click', (event) => {
    const menu = document.getElementById('examplesMenu');
    const button = document.querySelector('.examples-btn');
    if (!menu.contains(event.target) && !button.contains(event.target)) {
      menu.classList.remove('show');
    }
  });
  loadExample('hello');
  switchTab('validation');
}
window.onload = init;
