const scopeStack=[new Map()];
const bracketStack=[];
const ErrorList=[];


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

///////////////////////////////////////////////////////////////////////////////////////////

function validatePadam(line) {
    const trimmedLine = line.trim();
    if (!trimmedLine.startsWith('PADAM ')) {
        return { status: 'NOT_PADAM' };
    }
    const padamRegex = /^\s*PADAM\s+(?<variable>[a-zA-Z_]\w*)\s*:\s*(?<type>ANKHE|VARTTAI)(?:\s*=\s*(?<value>\d+|"[^"]*"))?\s*;\s*$/;
    const match = trimmedLine.match(padamRegex);
    if (!match) {
        if (!hasSemicolon(line)) {
            return { status: 'INVALID_SYNTAX', error: "Missing semicolon (;) at the end of the PADAM statement." };
        }
        return { status: 'INVALID_SYNTAX', error: "Syntax error in PADAM declaration." };
    }
    const { variable, type, value } = match.groups;
    if (value !== undefined) {
        const isStringValue = value.startsWith('"');
        if (type === 'ANKHE' && isStringValue) {
            return { status: 'SEMANTIC_ERROR', error: `Type Mismatch: Cannot assign a VARTTAI (string) to an ANKHE (integer) variable '${variable}'.` };
        }
        if (type === 'VARTTAI' && !isStringValue) {
            return { status: 'SEMANTIC_ERROR', error: `Type Mismatch: Cannot assign an ANKHE (integer) to a VARTTAI (string) variable '${variable}'.` };
        }
        return { status: 'VALID', type: 'initialization', data: { variable, type, value } };
    } else {
        return { status: 'VALID', type: 'declaration', data: { variable, type, value: undefined } };
    }
}

function validateCheppu(line) {
    const trimmedLine = line.trim();
    if (!trimmedLine.startsWith('CHEPPU')) {
        return { status: 'NOT_CHEPPU' };
    }
    const cheppuRegex = /^\s*CHEPPU\s*\(\s*(?<variable>[a-zA-Z_]\w*)\s*\)\s*;\s*$/;
    const match = trimmedLine.match(cheppuRegex);
    if (!match) {
        if (!hasSemicolon(line)) {
            return { status: 'INVALID_SYNTAX', error: "Missing semicolon (;) at the end of the CHEPPU statement." };
        }
        return { status: 'INVALID_SYNTAX', error: "Syntax error in CHEPPU statement. Expected format: CHEPPU(variable);" };
    }
    const { variable } = match.groups;
    const variableInfo = lookup(variable);
    if (variableInfo === null) {
        return { status: 'SEMANTIC_ERROR', error: `Undeclared Variable: Cannot get input for '${variable}' because it has not been declared.` };
    }
    return { status: 'VALID', data: { command: 'CHEPPU', variable: variable } };
}

function validateAssignment(line) {
    const trimmedLine = line.trim();
    if (!/(?<![=<>!])=(?![=])/.test(trimmedLine)) {
        return { status: 'NOT_ASSIGNMENT' };
    }
    const assignRegex = /^\s*(?<lhsVar>[a-zA-Z_]\w*)\s*=\s*(?<rhsExpr>.*);\s*$/;
    const match = trimmedLine.match(assignRegex);
    if (!match) {
        if (!hasSemicolon(line)) {
            return { status: 'INVALID_SYNTAX', error: "Missing semicolon (;) at the end of the assignment statement." };
        }
        return { status: 'INVALID_SYNTAX', error: "Invalid syntax for assignment statement." };
    }
    const { lhsVar, rhsExpr } = match.groups;
    const lhsInfo = lookup(lhsVar);
    if (!lhsInfo) {
        return { status: 'SEMANTIC_ERROR', error: `Undeclared variable '${lhsVar}' used in assignment.` };
    }
    let rhsType;
    const operators = ['+', '-', '*', '/'];
    const foundOperator = operators.find(op => rhsExpr.includes(op));
    if (foundOperator) {
        const parts = rhsExpr.split(foundOperator);
        if (parts.length !== 2) {
            return { status: 'INVALID_SYNTAX', error: 'Malformed expression. Only simple binary operations are supported.' };
        }
        const leftResult = getExpressionType(parts[0]);
        const rightResult = getExpressionType(parts[1]);
        if (!leftResult.success) return { status: 'SEMANTIC_ERROR', error: leftResult.error };
        if (!rightResult.success) return { status: 'SEMANTIC_ERROR', error: rightResult.error };
        if (leftResult.type === 'ANKHE' && rightResult.type === 'ANKHE') {
            rhsType = 'ANKHE';
        } else {
            return { status: 'SEMANTIC_ERROR', error: `Type Mismatch: Operator '${foundOperator}' can only be used between two ANKHE types.` };
        }
    } else {
        const result = getExpressionType(rhsExpr);
        if (!result.success) return { status: 'SEMANTIC_ERROR', error: result.error };
        rhsType = result.type;
    }
    if (lhsInfo.type !== rhsType) {
        return { status: 'SEMANTIC_ERROR', error: `Type Mismatch: Cannot assign a value of type ${rhsType} to variable '${lhsVar}' of type ${lhsInfo.type}.` };
    }
    return { status: 'VALID' };
}

function validateChatimpu(line) {
    const trimmedLine = line.trim();
    if (!trimmedLine.startsWith('CHATIMPU')) {
        return { status: 'NOT_CHATIMPU' };
    }
    const chatimpuRegex = /^\s*CHATIMPU\s*\(\s*(?<argument>"(?:\\.|[^"\\])*"|[a-zA-Z_]\w*)\s*\)\s*;\s*$/;
    const match = trimmedLine.match(chatimpuRegex);
    if (!match) {
        if (!hasSemicolon(line)) {
            return { status: 'INVALID_SYNTAX', error: "Missing semicolon (;) at the end of the CHATIMPU statement." };
        }
        return { status: 'INVALID_SYNTAX', error: "Syntax error in CHATIMPU. Expected format: CHATIMPU(variable_or_literal);" };
    }
    const { argument } = match.groups;
    if (argument.startsWith('"')) {
        return { status: 'VALID', data: { type: 'literal', value: argument } };
    } else {
        if (lookup(argument) === null) {
            return { status: 'SEMANTIC_ERROR', error: `Undeclared Variable: Cannot print '${argument}' because it has not been declared.` };
        }
        return { status: 'VALID', data: { type: 'variable', name: argument } };
    }
}

function validateElaitheHeader(line) {
    const trimmedLine = line.trim();
    if (!trimmedLine.startsWith('ELAITHE')) {
        return { status: 'NOT_ELAITHE' };
    }
    const headerRegex = /^\s*ELAITHE\s*\(\s*(?<operand1>\S+)\s*(?<operator>==|!=|<=|>=|<|>)\s*(?<operand2>\S+)\s*\)\s*\[\s*$/;
    const match = trimmedLine.match(headerRegex);
    if (!match) {
        return { status: 'INVALID_SYNTAX', error: "Syntax error in ELAITHE header. Expected: ELAITHE (value operator value) [" };
    }
    const { operand1, operator, operand2 } = match.groups;
    const op1Result = getExpressionType(operand1);
    const op2Result = getExpressionType(operand2);
    if (!op1Result.success) return { status: 'SEMANTIC_ERROR', error: op1Result.error };
    if (!op2Result.success) return { status: 'SEMANTIC_ERROR', error: op2Result.error };
    if (op1Result.type !== op2Result.type) {
        return { status: 'SEMANTIC_ERROR', error: `Type Mismatch: Cannot compare type ${op1Result.type} with type ${op2Result.type} in condition.` };
    }
    return { status: 'VALID' };
}

function validateBlockEnd(line) {
    const trimmedLine = line.trim();
    if (!trimmedLine.startsWith(']')) {
        return { status: 'NOT_A_BLOCK_END' };
    }
    const elseRegex = /^\s*]\s*ALAITHE\s*\[\s*$/;
    if (elseRegex.test(trimmedLine)) {
        return { status: 'VALID', data: { type: 'end_with_else' } };
    }
    const endOnlyRegex = /^\s*]\s*$/;
    if (endOnlyRegex.test(trimmedLine)) {
        return { status: 'VALID', data: { type: 'end_only' } };
    }
    return { status: 'INVALID_SYNTAX', error: "Malformed block-closing statement. Expected ']' or '] ALAITHE ['." };
}

function validateMalliMalliHeader(line,) {
    const trimmedLine = line.trim();
    if (!trimmedLine.startsWith('MALLI-MALLI')) {
        return { status: 'NOT_MALLI_MALLI' };
    }
    const mainRegex = /^\s*MALLI-MALLI\s*\((?<content>.*)\)\s*\[\s*$/;
    const mainMatch = trimmedLine.match(mainRegex);
    if (!mainMatch) {
        return { status: 'INVALID_SYNTAX', error: "Malformed MALLI-MALLI structure. Expected: MALLI-MALLI (...) [" };
    }
    const parts = mainMatch.groups.content.split(';').map(p => p.trim());
    if (parts.length !== 3) {
        return { status: 'INVALID_SYNTAX', error: "MALLI-MALLI loop requires three parts: initialization; condition; update." };
    }
    const initPart = parts[0];
    const padamRegex = /^\s*PADAM\s+(?<variable>[a-zA-Z_]\w*)\s*:\s*(?<type>ANKHE)\s*=\s*(?<value>\d+)\s*$/;
    const initMatch = initPart.match(padamRegex);
    if (!initMatch) {
        return { status: 'SEMANTIC_ERROR', error: "Loop initialization must be a PADAM statement initializing an ANKHE variable (e.g., PADAM i:ANKHE = 0)." };
    }
    const loopVarInfo = initMatch.groups;
    const loopVariableName = loopVarInfo.variable;
    const internalLookup = (varName) => {
        if (varName === loopVariableName) return { type: 'ANKHE' };
        return lookup(varName);
    };
    const determineType = (expr) => {
        if (/^\d+$/.test(expr.trim())) return { success: true, type: 'ANKHE' };
        const result = internalLookup(expr.trim());
        if (result) return { success: true, type: result.type };
        return { success: false, error: `Undeclared variable '${expr}' in loop condition.` };
    };
    const condPart = parts[1];
    const condRegex = /^\s*(?<op1>\S+)\s*(?<op>==|!=|<=|>=|<|>)\s*(?<op2>\S+)\s*$/;
    const condMatch = condPart.match(condRegex);
    if (!condMatch) return { status: 'INVALID_SYNTAX', error: `Malformed loop condition: "${condPart}".` };
    const op1Result = determineType(condMatch.groups.op1);
    const op2Result = determineType(condMatch.groups.op2);
    if (!op1Result.success) return { status: 'SEMANTIC_ERROR', error: op1Result.error };
    if (!op2Result.success) return { status: 'SEMANTIC_ERROR', error: op2Result.error };
    if (op1Result.type !== 'ANKHE' || op2Result.type !== 'ANKHE') {
        return { status: 'SEMANTIC_ERROR', error: `Loop condition must compare two ANKHE types.` };
    }
    const updatePart = parts[2];
    const updateRegex = /^\s*(?<lhs>\S+)\s*=\s*(?<rhs>\S+)\s*([+-])\s*1\s*$/;
    const updateMatch = updatePart.match(updateRegex);
    if (!updateMatch || updateMatch.groups.lhs !== loopVariableName || updateMatch.groups.rhs !== loopVariableName) {
        return { status: 'SEMANTIC_ERROR', error: `Loop update must be of the form '${loopVariableName} = ${loopVariableName} + 1'.` };
    }
    return { status: 'VALID', data: { variable: loopVarInfo.variable, type: loopVarInfo.type, value: loopVarInfo.value } };
}

///////////////////////////////////////////////////////////////////////////////////////////

function ece_cmd(command){
    const validationOrder = [
        validatePadam,
        validateCheppu,
        validateChatimpu,
        validateElaitheHeader,
        validateMalliMalliHeader,
        validateBlockEnd,
        validateAssignment
    ];

    for (const validator of validationOrder) {
        const result = validator(command);
        if (result.status === "VALID") {
            
            if (validator === validateElaitheHeader) {
                enterScope();
                bracketStack.push(1);
            } else if (validator === validateMalliMalliHeader) {
                enterScope();
                const declareResult = declare(result.data.variable, { type: result.data.type, value: result.data.value });
                if (!declareResult.success) {
                    
                    return { status: 'SEMANTIC_ERROR', error: declareResult.error };
                }
                bracketStack.push(3);
            } else if (validator === validateBlockEnd) {
                 if (bracketStack.length === 0) return {status:"Error", error:"Closing bracket ']' has no matching opening block."};
                 exitScope();
                 if (result.data.type === "end_with_else") {
                     enterScope();
                     if (bracketStack.pop() !== 1) return {status:"Error", error:"'ALAITHE' must follow an 'ELAITHE' block."};
                     bracketStack.push(2);
                 } else {
                     bracketStack.pop();
                 }
            } else if (validator === validatePadam) {
                const declareResult = declare(result.data.variable, { type: result.data.type, value: result.data.value });
                if (!declareResult.success) {
                    
                    return { status: 'SEMANTIC_ERROR', error: declareResult.error };
                }
            }
            return { status: "next" };
        }
        if (result.status === "SEMANTIC_ERROR" || result.status === "INVALID_SYNTAX") {
            return result; 
        }
    }

    return {status:"Error", error:"Invalid or unrecognized syntax"};
}

function valid_entire(token){
    scopeStack.length = 1;
    scopeStack[0].clear();
    bracketStack.length = 0;
    let flag=true;    
    for(let i=0; i<token.length; i++){
        let result=ece_cmd(token[i].trim());
        if(result.status !== "next"){
            //console.log(`Error on line ${i+1}: ${result.error}`);
            ErrorList.push(`Error on line ${i+1}: ${result.error}`);
            flag=false;
            //break; 
        }
    }
    if (flag && bracketStack.length !== 0) {
        console.log("Error: Unclosed block. Missing one or more ']' characters.");
        flag = false;
    }
    return flag;
}

// =================================================================
// TEST RUNNER
// =================================================================

const test_redeclare_variable = `
    PADAM counter:ANKHE = 10;|
    CHATIMPU(counter);|
    PADAM counter:VARTTAI = "ten";
`;
const test_undeclared_variable = `
    PADAM x:ANKHE = 5;|
    y = x + 2;
`; // ERROR: 'y' is used before being declared.


const test_type_mismatch_assign = `
    PADAM score:ANKHE;|
    score = "one hundred";
`; // ERROR: Assigning a VARTTAI (string) to an ANKHE (integer).

const test_type_mismatch_compare = `
    PADAM value:ANKHE = 10;|
    ELAITHE (value == "10") [|
        CHATIMPU("This shouldn't work!");|
    ]
`; // ERROR: Comparing an ANKHE with a VARTTAI.

const test_out_of_scope = `
    ELAITHE (1 == 1) [|
        PADAM secret:ANKHE = 42;|
    ]|
    CHATIMPU(secret);
`; // ERROR: 'secret' is declared inside the ELAITHE block and cannot be accessed outside.


// --- Syntax Errors (Structure and Grammar) ---

const test_malformed_if = `
    PADAM val:ANKHE = 5;|
    ELAITHE val > 3 [|
        CHATIMPU("Missing parentheses!");|
    ]
`; // ERROR: ELAITHE condition is missing parentheses (...).

const test_malformed_loop = `
    MALLI-MALLI (PADAM i:ANKHE = 0; i < 10) [|
        CHATIMPU(i);|
    ]
`; // ERROR: MALLI-MALLI is missing the third part (the update statement).

const test_else_without_if = `
    PADAM x:ANKHE = 1;|
    CHATIMPU(x);|
    ] ALAITHE [|
        CHATIMPU("This makes no sense.");|
    ]
`; // ERROR: 'ALAITHE' must follow an 'ELAITHE' block.

const test_unclosed_block = `
    MALLI-MALLI (PADAM i:ANKHE = 0; i < 2; i = i + 1) [|
        CHATIMPU("Never closed...");
`; // ERROR: Missing a closing ']' for the MALLI-MALLI block.


// =================================================================
// SCOPE-SPECIFIC TEST CASES
// =================================================================

// This should FAIL. The variable 'inner_if' only exists inside the ELAITHE block.
const test_access_after_if_scope = `
    PADAM x:ANKHE = 10;|
    ELAITHE (x > 5) [|
        PADAM inner_if:ANKHE = 100;|
        CHATIMPU(inner_if);|
    ]|
    CHATIMPU(inner_if);
`;

// This should FAIL. The loop variable 'i' only exists inside the MALLI-MALLI block.
const test_access_after_loop_scope = `
    MALLI-MALLI (PADAM i:ANKHE = 0; i < 3; i = i + 1) [|
        CHATIMPU("Inside loop");|
    ]|
    CHATIMPU(i);
`;

// This should FAIL. 'if_var' is declared in the 'if' scope, which is separate and closed
// before the 'else' scope is entered.
const test_access_from_if_to_else = `
    PADAM x:ANKHE = 1;|
    ELAITHE (x == 1) [|
        PADAM if_var:VARTTAI = "hello";|
    ] ALAITHE [|
        CHATIMPU(if_var);|
    ]
`;

// This should SUCCEED. It's valid to access variables from a parent or any outer scope.
const test_valid_nested_access = `
    PADAM outer:ANKHE = 50;|
    ELAITHE (outer == 50) [|
        CHATIMPU(outer);|
        PADAM middle:ANKHE = 100;|
        MALLI-MALLI (PADAM i:ANKHE = 0; i < 2; i = i + 1) [|
            CHATIMPU(outer);|
            CHATIMPU(middle);|
        ]|
    ]
`;

// This should SUCCEED. Declaring a new variable 'x' inside the block is called "shadowing".
// It's a different variable that only exists within that block.
const test_valid_shadowing = `
    PADAM x:ANKHE = 10;|
    CHATIMPU(x);|
    ELAITHE (x == 10) [|
        PADAM x:VARTTAI = "ten";|
        CHATIMPU(x);|
    ]|
    CHATIMPU(x);
`;
const program_sum_of_ten_naturals = `
    PADAM total:ANKHE = 0;|
    MALLI-MALLI (PADAM i:ANKHE = 1; i <= 10; i = i + 1) [|
        total = total + i;|
    ]|
    CHATIMPU(total);
`;
const program_fibonacci = `
    PADAM a:ANKHE = 0;|
    PADAM b:ANKHE = 1;|
    CHATIMPU("First 10 Fibonacci Numbers:");|
    CHATIMPU(a);|
    CHATIMPU(b);|
    MALLI-MALLI (PADAM i:ANKHE = 1; i <= 8; i = i + 1) [|
        PADAM next:ANKHE;|
        next = a + b;|
        CHATIMPU(next);|
        a = b;|
        b = next;|
    ]|
    CHATIMPU("...Done!");
`;

/////////////////////////////////////////////////////////////////////////
const fib_multiple_errors = `
    PADAM a:ANKHE = 0;|
    PADAM b:ANKHE = 1|
    CHATIMPU("Fibonacci sequence:");|
    CHATIMPU(a);|
    CHATIMPU(b);|
    MALLI-MALLI (PADAM i:ANKHE = 1; i <= 8; i = i + 1) [|
        PADAM next:ANKHE;|
        next = a + bee;|
        CHATIMPU(next);|
        a = "not a number";|
        b = next;|
    ]|
    CHATIMPU("...Done!");
`;
////////////////////////////////////////////////////////////////////////
const program_multiple_errors_2 = `
    PADAM val:ANKHE = 10;|
    PADAM message:VARTTAI = "Initial value";|
    PADAM val:ANKHE = 20;|
    CHATIMPU(message);|
    final_val = val + non_existent_var;|
    CHATIMPU(final_val)
`;
// function runTest(testName, programString) {
//     console.log(`\n--- Running Test: ${testName} ---`);
//     const tokens = tokenize(programString, '|');
//     const isValid = valid_entire(tokens);
//     console.log(`Validation Result: ${isValid ? "✅ Success" : "❌ Failed"}`);
//     console.log("------------------------------------");
// }
const program_countdown = `PADAM title:VARTTAI = "Countdown Program";|CHATIMPU(title);|PADAM start_val:ANKHE = 10;|MALLI-MALLI (PADAM i:ANKHE = start_val; i > 0; i = i - 1) [|ELAITHE (i == 5) [|CHATIMPU("...Halfway there!...");|] ALAITHE [|CHATIMPU(i);|]|]|CHATIMPU("Blast off! 🚀");`;
   const token=tokenize(program_multiple_errors_2,'|');
   const isValid = valid_entire(token);
   if(isValid==false){
       for(let i=0;i<ErrorList.length;i++){
        console.log(ErrorList[i]);
       }
   }


// =================================================================
// ADDITIONAL TEST CASES
// =================================================================

// This should FAIL. The variable 'loop_var' is declared in the first iteration.
// Your validator should catch the attempt to re-declare it in the same scope
// during the (conceptual) second iteration.
const test_redeclare_in_loop = `
    MALLI-MALLI (PADAM i:ANKHE = 0; i < 2; i = i + 1) [|
        PADAM loop_var:ANKHE = 10;|
    ]
`;



// This should SUCCEED. It validates that an if-else construct can be correctly
// nested and parsed inside a for loop.
const test_if_else_in_loop = `
    MALLI-MALLI (PADAM i:ANKHE = 0; i < 3; i = i + 1) [|
        ELAITHE (i > 1) [|
            CHATIMPU("Greater than 1");|
        ] ALAITHE [|
            CHATIMPU("Less than or equal to 1");|
        ]|
    ]
`;

// This should FAIL. The '] ALAITHE [' construct is not preceded by an
// 'ELAITHE (... [' block, which is a syntax violation.
const test_else_without_iff = `
    PADAM x:ANKHE = 1;|
    ] ALAITHE [|
        CHATIMPU("This makes no sense.");|
    ]
`;

// --- Add these calls to your test runner section ---
// console.log("\n\n## Running Additional Granular Tests ##");
// runTest("Redeclaration Error Inside Loop", test_redeclare_in_loop);
// runTest("Valid If/Else Inside Loop", test_if_else_in_loop);
// runTest("Else Without a Preceding If", test_else_without_iff);

// runTest("Correct Program", `PADAM x:ANKHE=1;| CHATIMPU(x);`);
// runTest("Undeclared Variable", test_undeclared_variable);
// runTest("Redeclared Variable", test_redeclare_variable);
// runTest("Type Mismatch Assignment", test_type_mismatch_assign);
// runTest("Type Mismatch Comparison", test_type_mismatch_compare);
// runTest("Out of Scope Access", test_out_of_scope);
// runTest("Malformed IF Statement", test_malformed_if);
// runTest("Malformed LOOP Statement", test_malformed_loop);
// runTest("ELSE without IF", test_else_without_if);
// runTest("Unclosed Block", test_unclosed_block);
// --- Execute all tests ---


// runTest("Access After IF Scope", test_access_after_if_scope);
// runTest("Access After LOOP Scope", test_access_after_loop_scope);
// runTest("Access from IF to ELSE Scope", test_access_from_if_to_else);
// runTest("Valid Nested Scope Access", test_valid_nested_access);
// runTest("Valid Variable Shadowing", test_valid_shadowing);
// =================================================================
// FURTHER EDGE CASE TESTS
// =================================================================

// This should SUCCEED. It tests deeply nested blocks to ensure the
// scopeStack and bracketStack are managed correctly.
const test_deep_nesting = `
    PADAM x:ANKHE = 10;|
    ELAITHE (x == 10) [|
        PADAM y:VARTTAI = "hello";|
        MALLI-MALLI (PADAM i:ANKHE = 0; i < 2; i = i + 1) [|
            CHATIMPU(y);|
            CHATIMPU(x);|
        ]|
    ]
`;

// This should SUCCEED. Empty blocks are valid in many languages
// and this test ensures your parser handles them correctly.
const test_empty_blocks = `
    ELAITHE (1 > 0) [|
    ] ALAITHE [|
    ]
`;

// This should FAIL. It checks for type mismatches within a binary
// expression. You cannot add an ANKHE and a VARTTAI.
const test_expression_type_mismatch = `
    PADAM a:ANKHE = 1;|
    PADAM b:ANKHE = 2;|
    a = b + "is not a number";
`;

// This should FAIL. Variable names cannot start with a number.
// This tests the regex in your validatePadam function.
const test_invalid_variable_name = `
    PADAM 1var:ANKHE = 100;
`;

// This should FAIL. An extra closing bracket is a structural error.
// This test validates that your code catches unbalanced brackets.
const test_extra_closing_bracket = `
    PADAM x:ANKHE = 1;|
    ELAITHE (x == 1) [|
        CHATIMPU("hello");|
    ]|
    ]
`;


// --- Add these calls to your test runner section ---
// console.log("\n\n## Running Further Edge Case Tests ##");
// runTest("Valid Deeply Nested Blocks", test_deep_nesting);
// runTest("Valid Empty Blocks", test_empty_blocks);
// runTest("Expression Type Mismatch", test_expression_type_mismatch);
// runTest("Invalid Variable Name", test_invalid_variable_name);
// runTest("Extra Closing Bracket", test_extra_closing_bracket);