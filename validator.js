const reservedWords = new Set(['PADAM', 'ANKHE', 'VARTTAI', 'ELAITHE', 'ALAITHE', 'MALLI-MALLI', 'CHATIMPU', 'CHEPPU']);

// Scope-Aware Variable Lookup
function lookupVariable(varName, scopeStack) {
    for (let i = scopeStack.length - 1; i >= 0; i--) {
        if (scopeStack[i].has(varName)) {
            return true; // Variable found
        }
    }
    return false; // Variable not found in any scope
}

// Function to add a variable to the CURRENT scope
function declareVariable(varName, varType, scopeStack, errors, lineNumber) {
    const currentScope = scopeStack[scopeStack.length - 1];
    if (currentScope.has(varName)) {
        errors.push(`Error on line ${lineNumber}: Variable '${varName}' is already declared in this scope.`);
        return;
    }
    if (reservedWords.has(varName)) {
        errors.push(`Error on line ${lineNumber}: Cannot use reserved word '${varName}' as a variable name.`);
        return;
    }
    currentScope.set(varName, varType);
}

function validateCode() {
    const code = document.getElementById('codeInput').value;
    const outputDiv = document.getElementById('output');
    const lines = code.split('\n');
    let errors = [];

    // ==========================================================
    // NEW: Block Stack for Precise Bracket Balancing
    // ==========================================================
    let blockStack = []; // Stores objects like { type: 'ELAITHE', line: 5 }
    let errorFound = false;

    for (const [i, line] of lines.entries()) {
        const lineNumber = i + 1;
        const trimmedLine = line.trim();

        // Check for block-opening statements
        if (trimmedLine.startsWith('ELAITHE') || trimmedLine.startsWith('ALAITHE') || trimmedLine.startsWith('MALLI-MALLI')) {
             if (trimmedLine.endsWith('[')) {
                const blockType = trimmedLine.split('(')[0].trim();
                blockStack.push({ type: blockType, line: lineNumber });
             }
        }
        
        // Check for closing brackets
        if (trimmedLine.includes(']')) {
            if (blockStack.length > 0) {
                blockStack.pop(); // Correctly closed a block
            } else {
                errors.push(`Syntax Error on line ${lineNumber}: Unexpected closing bracket ']' with no corresponding open block.`);
                errorFound = true;
                break;
            }
        }
    }

    // After checking all lines, see if any blocks were left open
    if (!errorFound && blockStack.length > 0) {
        const unclosedBlock = blockStack.pop();
        errors.push(`Syntax Error: Unclosed '${unclosedBlock.type}' block that started on line ${unclosedBlock.line}.`);
        errorFound = true;
    }

    if (errorFound) {
        outputDiv.innerHTML = `<span class="error">${errors.map(e => `• ${e}`).join('<br>')}</span>`;
        return;
    }
    // ==========================================================
    // End of New Section
    // ==========================================================


    // Scope Stack validation (can proceed now that brackets are balanced)
    let scopeStack = [new Map()];

    lines.forEach((line, index) => {
        const lineNumber = index + 1;
        const trimmedLine = line.trim();

        if (trimmedLine === '' || trimmedLine.startsWith('#')) return;

        if (trimmedLine.includes('[')) {
            scopeStack.push(new Map());
        }
        if (trimmedLine.includes(']')) {
            if (scopeStack.length > 1) {
                scopeStack.pop();
            }
        }
        
        if (trimmedLine === ']') return;

        if (trimmedLine.startsWith('PADAM')) {
            parseDeclaration(trimmedLine, lineNumber, scopeStack, errors);
        } else if (trimmedLine.startsWith('MALLI-MALLI')) {
            parseMalliMalli(trimmedLine, lineNumber, scopeStack, errors);
        } else if (trimmedLine.startsWith('CHATIMPU')) {
            parseChatimpu(trimmedLine, lineNumber, scopeStack, errors);
        } else if (trimmedLine.startsWith('CHEPPU')) {
            parseCheppu(trimmedLine, lineNumber, scopeStack, errors);
        } else if (trimmedLine.match(/^[a-zA-Z_]\w*\s*=/)) {
            parseAssignment(trimmedLine, lineNumber, scopeStack, errors);
        }
    });

    if (errors.length === 0) {
        outputDiv.innerHTML = '<span class="success">Validation Successful! Your Yantrabhasha code is clean. ✅</span>';
    } else {
        outputDiv.innerHTML = `<span class="error">${[...new Set(errors)].map(e => `• ${e}`).join('<br>')}</span>`;
    }
}


// --- All other parsing functions (parseDeclaration, etc.) remain unchanged ---

function parseDeclaration(line, lineNumber, scopeStack, errors) {
    const match = line.match(/^PADAM\s+([a-zA-Z_]\w*)\s*:\s*(ANKHE|VARTTAI)\s*(?:=\s*(.+))?;$/);
    if (!match) {
        errors.push(`Error on line ${lineNumber}: Invalid variable declaration syntax.`);
        return;
    }
    const [, varName, varType, value] = match;
    declareVariable(varName, varType, scopeStack, errors, lineNumber);
}

function parseMalliMalli(line, lineNumber, scopeStack, errors) {
    const match = line.match(/^MALLI-MALLI\s*\((.*);(.*);(.*)\)/);
    if (!match) {
        errors.push(`Error on line ${lineNumber}: Invalid MALLI-MALLI loop syntax.`);
        return;
    }
    const [, init, condition, update] = match.map(s => (s || '').trim());

    if (init.startsWith('PADAM')) {
        const declMatch = init.match(/^PADAM\s+([a-zA-Z_]\w*)\s*:\s*(ANKHE|VARTTAI)/);
        if (declMatch) {
            const [, varName, varType] = declMatch;
            declareVariable(varName, varType, scopeStack, errors, lineNumber);
        }
    } else {
        checkVariablesInExpression(init, lineNumber, scopeStack, errors);
    }
    checkVariablesInExpression(condition, lineNumber, scopeStack, errors);
    checkVariablesInExpression(update, lineNumber, scopeStack, errors);
}

function parseAssignment(line, lineNumber, scopeStack, errors) {
    const varName = line.split('=')[0].trim();
    if (!lookupVariable(varName, scopeStack)) {
        errors.push(`Error on line ${lineNumber}: Variable '${varName}' is not declared.`);
        return;
    }
    const expression = line.split('=')[1].trim().replace(';', '');
    checkVariablesInExpression(expression, lineNumber, scopeStack, errors);
}

function parseChatimpu(line, lineNumber, scopeStack, errors) {
    const match = line.match(/^CHATIMPU\((.*)\);$/);
    if (!match) {
        errors.push(`Error on line ${lineNumber}: Invalid CHATIMPU syntax.`);
        return;
    }
    const argument = match[1].trim();
    if (!/^".*"$/.test(argument)) {
        checkVariablesInExpression(argument, lineNumber, scopeStack, errors);
    }
}

function parseCheppu(line, lineNumber, scopeStack, errors) {
    const match = line.match(/^CHEPPU\((.*)\);$/);
    if (!match) {
        errors.push(`Error on line ${lineNumber}: Invalid CHEPPU syntax.`);
        return;
    }
    const varName = match[1].trim();
    if (!lookupVariable(varName, scopeStack)) {
        errors.push(`Error on line ${lineNumber}: Variable '${varName}' used in CHEPPU is not declared.`);
    }
}

function checkVariablesInExpression(expr, lineNumber, scopeStack, errors) {
    const variables = expr.match(/[a-zA-Z_]\w*/g) || [];
    variables.forEach(varName => {
        if (!lookupVariable(varName, scopeStack) && !reservedWords.has(varName)) {
            errors.push(`Error on line ${lineNumber}: Variable '${varName}' is used before declaration.`);
        }
    });
}

// Add the event listener to the button
document.getElementById('validateBtn').addEventListener('click', validateCode);