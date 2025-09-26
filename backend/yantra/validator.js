// This file contains the pure validation logic, adapted for a Node.js environment.
// It does not interact with the DOM. It takes code as input and returns a result object.

const reservedWords = new Set(['PADAM', 'ANKHE', 'VARTTAI', 'ELAITHE', 'ALAITHE', 'MALLI-MALLI', 'CHATIMPU', 'CHEPPU']);

// Helper functions (lookupVariable, declareVariable) are the same as before
const lookupVariable = (varName, scopeStack) => {
    for (let i = scopeStack.length - 1; i >= 0; i--) {
        if (scopeStack[i].has(varName)) return true;
    }
    return false;
};

const declareVariable = (varName, varType, scopeStack, errors, lineNumber) => {
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
};

// Main validation function to be exported
const validateYantrabhasha = (code) => {
    const lines = code.split('\n');
    let errors = [];
    
    // --- Bracket Balancing Check ---
    let blockStack = [];
    let errorFound = false;

    for (const [i, line] of lines.entries()) {
        const lineNumber = i + 1;
        const trimmedLine = line.trim();
        if (trimmedLine.startsWith('ELAITHE') || trimmedLine.startsWith('ALAITHE') || trimmedLine.startsWith('MALLI-MALLI')) {
            if (trimmedLine.endsWith('[')) {
                const blockType = trimmedLine.split('(')[0].trim();
                blockStack.push({ type: blockType, line: lineNumber });
            }
        }
        if (trimmedLine.includes(']')) {
            if (blockStack.length > 0) {
                blockStack.pop();
            } else {
                errors.push(`Syntax Error on line ${lineNumber}: Unexpected closing bracket ']' with no corresponding open block.`);
                errorFound = true;
                break;
            }
        }
    }
    if (!errorFound && blockStack.length > 0) {
        const unclosedBlock = blockStack.pop();
        errors.push(`Syntax Error: Unclosed '${unclosedBlock.type}' block that started on line ${unclosedBlock.line}.`);
        errorFound = true;
    }
    if (errorFound) {
        return { status: 'error', message: errors };
    }
    
    // --- Scope and Syntax Validation ---
    let scopeStack = [new Map()];
    lines.forEach((line, index) => {
        const lineNumber = index + 1;
        const trimmedLine = line.trim();

        if (trimmedLine === '' || trimmedLine.startsWith('#')) return;
        if (trimmedLine.includes('[')) scopeStack.push(new Map());
        if (trimmedLine.includes(']')) {
            if (scopeStack.length > 1) scopeStack.pop();
        }
        if (trimmedLine === ']') return;

        // --- Statement Parsers ---
        if (trimmedLine.startsWith('PADAM')) {
            parseDeclaration(trimmedLine, lineNumber, scopeStack, errors);
        } // ... include all other parse functions (parseMalliMalli, parseChatimpu, etc.) here
    });

    if (errors.length > 0) {
        return { status: 'error', message: [...new Set(errors)] };
    }

    return { status: 'success', message: ['Validation Successful! Your Yantrabhasha code is clean. ✅'] };
};


// --- All the parsing helper functions go here (unchanged) ---
// I'm omitting them for brevity, but you should copy parseDeclaration,
// parseMalliMalli, parseAssignment, parseChatimpu, parseCheppu, and
// checkVariablesInExpression from your previous JS file into here.


module.exports = { validateYantrabhasha };
