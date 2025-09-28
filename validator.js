// File: validator.js
const scopeStack=[new Map()];
const bracketStack=[];

// --- Helper Functions ---

function hasSemicolon(line) {
  if (typeof line !== 'string') {
    return false;
  }
  return line.trim().endsWith(';');
}

function getExpressionType(expression) {
    const trimmedExpr = expression.trim();
    if (/^\d+$/.test(trimmedExpr)) return { success: true, type: 'ANKHE' };
    if (/^"[^"]*"?$/.test(trimmedExpr)) return { success: true, type: 'VARTTAI' };
    const variableInfo = lookup(trimmedExpr);
    if (variableInfo) return { success: true, type: variableInfo.type };
    return { success: false, error: `Semantic Error: Variable '${trimmedExpr}' was used before it was declared.` };
}

function tokenize(input,del){
     let token=[];
     let left=0;
     let right=0;
     while(left<input.length){
         if(left==right && input[left]==del){
            left++;
            continue;
         }
         right=left+1;
         while(right<input.length && input[right]!=del){
            right++;
         }
         token.push(input.substring(left,right));
         left=right;
     }
     return token;
}

function enterScope(){
    scopeStack.push(new Map());
}

function exitScope(){
      if(scopeStack.length>1){
        scopeStack.pop();
      }
}

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

// --- Specific Statement Validators ---

function validatePadam(line) {
    const trimmedLine = line.trim();
    if (!trimmedLine.startsWith('PADAM ')) { return { status: 'NOT_PADAM' }; }
    const padamRegex = /^\s*PADAM\s+(?<variable>[a-zA-Z_]\w*)\s*:\s*(?<type>ANKHE|VARTTAI)(?:\s*=\s*(?<value>\d+|"[^"]*"))?\s*;\s*$/;
    const match = trimmedLine.match(padamRegex);
    if (!match) {
        if (!hasSemicolon(line)) { return { status: 'INVALID_SYNTAX', error: "Missing semicolon (;) at the end of the PADAM statement." }; }
        return { status: 'INVALID_SYNTAX', error: "Syntax error in PADAM declaration." };
    }
    const { variable, type, value } = match.groups;
    if (value !== undefined) {
        const isStringValue = value.startsWith('"');
        if (type === 'ANKHE' && isStringValue) { return { status: 'SEMANTIC_ERROR', error: `Type Mismatch: Cannot assign a VARTTAI (string) to an ANKHE (integer) variable '${variable}'.` }; }
        if (type === 'VARTTAI' && !isStringValue) { return { status: 'SEMANTIC_ERROR', error: `Type Mismatch: Cannot assign an ANKHE (integer) to a VARTTAI (string) variable '${variable}'.` }; }
        return { status: 'VALID', type: 'initialization', data: { variable, type, value } };
    } else {
        return { status: 'VALID', type: 'declaration', data: { variable, type, value: undefined } };
    }
}

function validateCheppu(line) {
    const trimmedLine = line.trim();
    if (!trimmedLine.startsWith('CHEPPU')) { return { status: 'NOT_CHEPPU' }; }
    const cheppuRegex = /^\s*CHEPPU\s*\(\s*(?<variable>[a-zA-Z_]\w*)\s*\)\s*;\s*$/;
    const match = trimmedLine.match(cheppuRegex);
    if (!match) {
        if (!hasSemicolon(line)) { return { status: 'INVALID_SYNTAX', error: "Missing semicolon (;) at the end of the CHEPPU statement." }; }
        return { status: 'INVALID_SYNTAX', error: "Syntax error in CHEPPU statement. Expected format: CHEPPU(variable);" };
    }
    const { variable } = match.groups;
    if (lookup(variable) === null) { return { status: 'SEMANTIC_ERROR', error: `Undeclared Variable: Cannot get input for '${variable}' because it has not been declared.` }; }
    return { status: 'VALID', data: { command: 'CHEPPU', variable: variable } };
}

function validateAssignment(line) {
    const trimmedLine = line.trim();
    if (!/(?<![=<>!])=(?![=])/.test(trimmedLine)) { return { status: 'NOT_ASSIGNMENT' }; }
    const assignRegex = /^\s*(?<lhsVar>[a-zA-Z_]\w*)\s*=\s*(?<rhsExpr>.*);\s*$/;
    const match = trimmedLine.match(assignRegex);
    if (!match) {
        if (!hasSemicolon(line)) { return { status: 'INVALID_SYNTAX', error: "Missing semicolon (;) at the end of the assignment statement." }; }
        return { status: 'INVALID_SYNTAX', error: "Invalid syntax for assignment statement." };
    }
    const { lhsVar, rhsExpr } = match.groups;
    const lhsInfo = lookup(lhsVar);
    if (!lhsInfo) { return { status: 'SEMANTIC_ERROR', error: `Undeclared variable '${lhsVar}' used in assignment.` }; }
    let rhsType;
    const operators = ['+', '-', '*', '/'];
    const foundOperator = operators.find(op => rhsExpr.includes(op));
    if (foundOperator) {
        const parts = rhsExpr.split(foundOperator);
        if (parts.length !== 2) { return { status: 'INVALID_SYNTAX', error: 'Malformed expression. Only simple binary operations are supported.' }; }
        const leftResult = getExpressionType(parts[0]);
        const rightResult = getExpressionType(parts[1]);
        if (!leftResult.success) return { status: 'SEMANTIC_ERROR', error: leftResult.error };
        if (!rightResult.success) return { status: 'SEMANTIC_ERROR', error: rightResult.error };
        if (leftResult.type === 'ANKHE' && rightResult.type === 'ANKHE') { rhsType = 'ANKHE'; }
        else { return { status: 'SEMANTIC_ERROR', error: `Type Mismatch: Operator '${foundOperator}' can only be used between two ANKHE types.` }; }
    } else {
        const result = getExpressionType(rhsExpr);
        if (!result.success) return { status: 'SEMANTIC_ERROR', error: result.error };
        rhsType = result.type;
    }
    if (lhsInfo.type !== rhsType) { return { status: 'SEMANTIC_ERROR', error: `Type Mismatch: Cannot assign a value of type ${rhsType} to variable '${lhsVar}' of type ${lhsInfo.type}.` }; }
    return { status: 'VALID' };
}

function validateChatimpu(line) {
    const trimmedLine = line.trim();
    if (!trimmedLine.startsWith('CHATIMPU')) { return { status: 'NOT_CHATIMPU' }; }
    const chatimpuRegex = /^\s*CHATIMPU\s*\(\s*(?<argument>"(?:\\.|[^"\\])*"|[a-zA-Z_]\w*)\s*\)\s*;\s*$/;
    const match = trimmedLine.match(chatimpuRegex);
    if (!match) {
        if (!hasSemicolon(line)) { return { status: 'INVALID_SYNTAX', error: "Missing semicolon (;) at the end of the CHATIMPU statement." }; }
        return { status: 'INVALID_SYNTAX', error: "Syntax error in CHATIMPU. Expected format: CHATIMPU(variable_or_literal);" };
    }
    const { argument } = match.groups;
    if (argument.startsWith('"')) { return { status: 'VALID', data: { type: 'literal', value: argument } }; }
    else { if (lookup(argument) === null) { return { status: 'SEMANTIC_ERROR', error: `Undeclared Variable: Cannot print '${argument}' because it has not been declared.` }; } return { status: 'VALID', data: { type: 'variable', name: argument } }; }
}

function validateElaitheHeader(line) {
    const trimmedLine = line.trim();
    if (!trimmedLine.startsWith('ELAITHE')) { return { status: 'NOT_ELAITHE' }; }
    const headerRegex = /^\s*ELAITHE\s*\(\s*(?<operand1>\S+)\s*(?<operator>==|!=|<=|>=|<|>)\s*(?<operand2>\S+)\s*\)\s*\[\s*$/;
    const match = trimmedLine.match(headerRegex);
    if (!match) { return { status: 'INVALID_SYNTAX', error: "Syntax error in ELAITHE header. Expected: ELAITHE (value operator value) [" }; }
    const { operand1, operator, operand2 } = match.groups;
    const op1Result = getExpressionType(operand1);
    const op2Result = getExpressionType(operand2);
    if (!op1Result.success) return { status: 'SEMANTIC_ERROR', error: op1Result.error };
    if (!op2Result.success) return { status: 'SEMANTIC_ERROR', error: op2Result.error };
    if (op1Result.type !== op2Result.type) { return { status: 'SEMANTIC_ERROR', error: `Type Mismatch: Cannot compare type ${op1Result.type} with type ${op2Result.type} in condition.` }; }
    return { status: 'VALID' };
}

function validateBlockEnd(line) {
    const trimmedLine = line.trim();
    if (!trimmedLine.startsWith(']')) { return { status: 'NOT_A_BLOCK_END' }; }
    if (/^\s*]\s*ALAITHE\s*\[\s*$/.test(trimmedLine)) { return { status: 'VALID', data: { type: 'end_with_else' } }; }
    if (/^\s*]\s*$/.test(trimmedLine)) { return { status: 'VALID', data: { type: 'end_only' } }; }
    return { status: 'INVALID_SYNTAX', error: "Malformed block-closing statement. Expected ']' or '] ALAITHE ['." };
}

function validateMalliMalliHeader(line,) {
    const trimmedLine = line.trim();
    if (!trimmedLine.startsWith('MALLI-MALLI')) { return { status: 'NOT_MALLI_MALLI' }; }
    const mainRegex = /^\s*MALLI-MALLI\s*\((?<content>.*)\)\s*\[\s*$/;
    const mainMatch = trimmedLine.match(mainRegex);
    if (!mainMatch) { return { status: 'INVALID_SYNTAX', error: "Malformed MALLI-MALLI structure. Expected: MALLI-MALLI (...) [" }; }
    const parts = mainMatch.groups.content.split(';').map(p => p.trim());
    if (parts.length !== 3) { return { status: 'INVALID_SYNTAX', error: "MALLI-MALLI loop requires three parts: initialization; condition; update." }; }
    const initPart = parts[0];
    const padamRegex = /^\s*PADAM\s+(?<variable>[a-zA-Z_]\w*)\s*:\s*(?<type>ANKHE)\s*=\s*(?<value>\d+)\s*$/;
    const initMatch = initPart.match(padamRegex);
    if (!initMatch) { return { status: 'SEMANTIC_ERROR', error: "Loop initialization must be a PADAM statement initializing an ANKHE variable (e.g., PADAM i:ANKHE = 0)." }; }
    const loopVarInfo = initMatch.groups; const loopVariableName = loopVarInfo.variable;
    const internalLookup = (varName) => { if (varName === loopVariableName) return { type: 'ANKHE' }; return lookup(varName); };
    const determineType = (expr) => { if (/^\d+$/.test(expr.trim())) return { success: true, type: 'ANKHE' }; const result = internalLookup(expr.trim()); if (result) return { success: true, type: result.type }; return { success: false, error: `Undeclared variable '${expr}' in loop condition.` }; };
    const condPart = parts[1];
    const condRegex = /^\s*(?<op1>\S+)\s*(?<op>==|!=|<=|>=|<|>)\s*(?<op2>\S+)\s*$/;
    const condMatch = condPart.match(condRegex);
    if (!condMatch) return { status: 'INVALID_SYNTAX', error: `Malformed loop condition: "${condPart}".` };
    const op1Result = determineType(condMatch.groups.op1); const op2Result = determineType(condMatch.groups.op2);
    if (!op1Result.success) return { status: 'SEMANTIC_ERROR', error: op1Result.error };
    if (!op2Result.success) return { status: 'SEMANTIC_ERROR', error: op2Result.error };
    if (op1Result.type !== 'ANKHE' || op2Result.type !== 'ANKHE') { return { status: 'SEMANTIC_ERROR', error: `Loop condition must compare two ANKHE types.` }; }
    const updatePart = parts[2];
    const updateRegex = /^\s*(?<lhs>\S+)\s*=\s*(?<rhs>\S+)\s*([+-])\s*1\s*$/;
    const updateMatch = updatePart.match(updateRegex);
    if (!updateMatch || updateMatch.groups.lhs !== loopVariableName || updateMatch.groups.rhs !== loopVariableName) { return { status: 'SEMANTIC_ERROR', error: `Loop update must be of the form '${loopVariableName} = ${loopVariableName} + 1'.` }; }
    return { status: 'VALID', data: { variable: loopVarInfo.variable, type: loopVarInfo.type, value: loopVarInfo.value } };
}

// --- Main Validator Logic ---

function ece_cmd(command) {
    const validationOrder = [ validatePadam, validateCheppu, validateChatimpu, validateElaitheHeader, validateMalliMalliHeader, validateBlockEnd, validateAssignment ];
    for (const validator of validationOrder) {
        const result = validator(command);
        if (result.status === "VALID") {
            if (validator === validateElaitheHeader) { enterScope(); bracketStack.push(1); }
            else if (validator === validateMalliMalliHeader) { enterScope(); const declareResult = declare(result.data.variable, { type: result.data.type, value: result.data.value }); if (!declareResult.success) { return { status: 'SEMANTIC_ERROR', error: declareResult.error }; } bracketStack.push(3); }
            else if (validator === validateBlockEnd) { if (bracketStack.length === 0) return {status:"Error", error:"Closing bracket ']' has no matching opening block."}; exitScope(); if (result.data.type === "end_with_else") { enterScope(); if (bracketStack.length === 0 || bracketStack.pop() !== 1) return {status:"Error", error:"'ALAITHE' must follow an 'ELAITHE' block."}; bracketStack.push(2); } else { bracketStack.pop(); } }
            else if (validator === validatePadam) { const declareResult = declare(result.data.variable, { type: result.data.type, value: result.data.value }); if (!declareResult.success) { return { status: 'SEMANTIC_ERROR', error: declareResult.error }; } }
            return { status: "next" };
        }
        if (result.status === "SEMANTIC_ERROR") { if (validator === validateElaitheHeader || validator === validateMalliMalliHeader) { enterScope(); if (validator === validateElaitheHeader) { bracketStack.push(1); } else { bracketStack.push(3); } } return result; }
        if (result.status === "INVALID_SYNTAX") { return result; }
    }
    return {status:"Error", error:"Invalid or unrecognized syntax"};
}

function valid_entire(token){
    let errorList=[];
    scopeStack.length = 1; scopeStack[0].clear(); bracketStack.length = 0;
    let flag=true;
    for(let i=0; i<token.length; i++){
        const line = token[i].trim();
        if (line === '') continue;
        let result=ece_cmd(line);
        if(result.status !== "next"){
            errorList.push({line: i + 1, message: result.error});
            flag=false;
        }
    }
    if (flag && bracketStack.length !== 0) {
        errorList.push({line: token.length, message: "Unclosed block. Missing one or more ']' characters."});
        flag = false;
    }
    return {isValid:flag, errors:errorList};
}

// Main function to be called by app.js
function validateCode(program){
   const token=tokenize(program,'|');
   const result = valid_entire(token);
   return {
       isValid: result.isValid,
       errors: result.errors,
       warnings: [],
       variables: [],
       console: []
   };
}