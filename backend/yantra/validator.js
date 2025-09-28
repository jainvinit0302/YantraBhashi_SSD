// backend/yantra/validator.js

// =================================================================
// 1. GLOBAL STATE (Reset on each function call)
//    These will be re-initialized inside validateCode
// =================================================================
let scopeStack = [new Map()];
let bracketStack = [];
let ErrorList = [];

// =================================================================
// 2. CORE UTILITY FUNCTIONS
// =================================================================

function hasSemicolon(line) {
    if (typeof line !== 'string') return false;
    return line.trim().endsWith(';');
}

function enterScope() { scopeStack.push(new Map()); }
function exitScope() { if (scopeStack.length > 1) scopeStack.pop(); }

function declare(variableName, info) {
    const currentScope = scopeStack[scopeStack.length - 1];
    if (currentScope.has(variableName)) {
        return { success: false, error: `Semantic Error: Variable '${variableName}' has already been declared in this scope.` };
    }
    currentScope.set(variableName, info);
    return { success: true };
}

function lookup(variableName) {
    for (let i = scopeStack.length - 1; i >= 0; i--) {
        if (scopeStack[i].has(variableName)) {
            return scopeStack[i].get(variableName);
        }
    }
    return null;
}

// NOTE: All validator functions (validatePadam, validateCheppu, validateAssignment, etc.)
// must also be defined here, just like `ece_cmd` below, to ensure they are accessible.

// =================================================================
// 3. MAIN COMMAND RUNNER (ece_cmd)
// =================================================================

// NOTE: You MUST include all your validation functions here (validatePadam, validateCheppu, etc.) 
// before ece_cmd, as they are called by ece_cmd.

function ece_cmd(command) {
    // ... [Your existing ece_cmd logic goes here] ...
    // The validationOrder array and the switch/if-else logic must be fully present.
    
    // For brevity, I'm using a placeholder:
    return { status: "Error", error: "Please include all validation function implementations here." };
}

// =================================================================
// 4. MAIN EXPORTED FUNCTION
// =================================================================

const validateCode = (code) => {
    // 1. Reset Global/Shared State for a clean run
    scopeStack.length = 1;
    scopeStack[0].clear();
    bracketStack.length = 0;
    ErrorList.length = 0; // Clear the previous errors

    // 2. Tokenize the code
    const tokens = code.replace(/\n/g, "|").split('|').map(line => line.trim()).filter(Boolean);
    let flag = true;

    // 3. Run the validation sequence
    for (let i = 0; i < tokens.length; i++) {
        const result = ece_cmd(tokens[i].trim());
        if (result.status !== "next") {
            ErrorList.push(`Error on line ${i + 1}: ${result.error}`);
            flag = false;
            // Note: You may want to continue to find all errors, or break early.
            // Based on your original code, you find all errors, so let's continue.
        }
    }

    if (bracketStack.length !== 0) {
        ErrorList.push("Structural Error: Unclosed block. Missing one or more ']' characters.");
        flag = false;
    }

    // 4. Return the consolidated result
    return {
        isValid: flag,
        errors: ErrorList
    };
};

module.exports = { validateCode };