//console.log("hello");

const scopeStack=[new Map()];
const bracketStack_if=[];
////////////////////////////////////////////////////////////////////////
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
////////////////////////////////////////////////////////////////////////
function enterScope(){

    scopeStack.push(new Map());
}
///////////////////////////////////////////////////////////////////////
function exitScope(){
      if(scopeStack.length>1){
        scopeStack.pop();
      }
}
////////////////////////////////////////////////////////////////////////\
function declare(variableName, info) {
    const currentScope = scopeStack[scopeStack.length - 1];

    
    if (currentScope.has(variableName)) {
       
        return {
            success: false,
            error: `Semantic Error: Variable '${variableName}' has already been declared in this scope.`
        };
    }

  
    currentScope.set(variableName, info);
    return { success: true };
}
////////////////////////////////////////////////////////////////////////
function lookup(variableName) {
    for (let i = scopeStack.length - 1; i >= 0; i--) {
        if (scopeStack[i].has(variableName)) {
            return scopeStack[i].get(variableName);
        }
    }
    return null;
}
///////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////////
function validatePadam(line) {
    const trimmedLine = line.trim();

    if (!trimmedLine.startsWith('PADAM ')) {
        return { status: 'NOT_PADAM' };
    }
const padamRegex = /^\s*PADAM\s+(?<variable>[a-zA-Z_]\w*)\s*:\s*(?<type>ANKHE|VARTTAI)(?:\s*=\s*(?<value>\d+|"[^"]*:"))?\s*;\s*$/;
    

    const match = trimmedLine.match(padamRegex);

    if (!match) {
        return { status: 'INVALID_SYNTAX', error: "Syntax error in PADAM declaration." };
    }

    const { variable, type, value } = match.groups;
    
   
    if (value !== undefined) {
        
        const isStringValue = value.startsWith('"');
        
        if (type === 'ANKHE' && isStringValue) {
            return {
                status: 'SEMANTIC_ERROR',
                error: `Type Mismatch: Cannot assign a VARTTAI (string) to an ANKHE (integer) variable '${variable}'.`
            };
        }
        
        if (type === 'VARTTAI' && !isStringValue) {
            return {
                status: 'SEMANTIC_ERROR',
                error: `Type Mismatch: Cannot assign an ANKHE (integer) to a VARTTAI (string) variable '${variable}'.`
            };
        }

        return { 
            status: 'VALID', 
            type: 'initialization',
            data: { variable, type, value } 
        };

    } else {
       
        return { 
            status: 'VALID', 
            type: 'declaration',
            data: { variable, type, value: undefined } 
        };
    }
}
///////////////////////////////////////////////////////////////////////////////

function validateCheppu(line, lookupFn) {
    const trimmedLine = line.trim();

   
    if (!trimmedLine.startsWith('CHEPPU')) {
        return { status: 'NOT_CHEPPU' };
    }

   
   const cheppuRegex = /^\s*CHEPPU\s*\(\s*(?<variable>[a-zA-Z_]\w*)\s*\)\s*;\s*$/;
    const match = trimmedLine.match(cheppuRegex);

    if (!match) {
        return { 
            status: 'INVALID_SYNTAX', 
            error: "Syntax error in CHEPPU statement. Expected format: CHEPPU(variable)" 
        };
    }

    const { variable } = match.groups;

  
    const variableInfo = lookupFn(variable);
    
    if (variableInfo === null) {
        return {
            status: 'SEMANTIC_ERROR',
            error: `Undeclared Variable: Cannot get input for '${variable}' because it has not been declared.`
        };
    }

  
    return {
        status: 'VALID',
        data: {
            command: 'CHEPPU',
            variable: variable
        }
    };
}
///////////////////////////////////////////////////////////////////////////////

function validateAssignment(line) {
    
    const assignRegex = /^\s*(?<lhsVar>[a-zA-Z_]\w*)\s*=\s*(?<rhsExpr>.*)\s*;\s*$/;
    const match = line.trim().match(assignRegex);

    if (!match) {
        return { status: 'NOT_ASSIGNMENT' };
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

        const leftResult = getExpressionType(parts[0], lookupFn);
        const rightResult = getExpressionType(parts[1], lookupFn);

        if (!leftResult.success) return { status: 'SEMANTIC_ERROR', error: leftResult.error };
        if (!rightResult.success) return { status: 'SEMANTIC_ERROR', error: rightResult.error };
        
        
        if (leftResult.type === 'ANKHE' && rightResult.type === 'ANKHE') {
            rhsType = 'ANKHE';
        } else {
            return { status: 'SEMANTIC_ERROR', error: `Type Mismatch: Operator '${foundOperator}' can only be used between two ANKHE types.` };
        }
    } else {
       
        const result = getExpressionType(rhsExpr, lookupFn);
        if (!result.success) return { status: 'SEMANTIC_ERROR', error: result.error };
        rhsType = result.type;
    }

    if (lhsInfo.type !== rhsType) {
        return { 
            status: 'SEMANTIC_ERROR', 
            error: `Type Mismatch: Cannot assign a value of type ${rhsType} to variable '${lhsVar}' of type ${lhsInfo.type}.` 
        };
    }
    
    return { status: 'VALID' };
}
///////////////////////////////////////////////////////////////////////////////


 
function validateChatimpu(line) {
    const trimmedLine = line.trim();

   
    if (!trimmedLine.startsWith('CHATIMPU')) {
        return { status: 'NOT_CHATIMPU' };
    }

 const chatimpuRegex = /^\s*CHATIMPU\s*\(\s*(?<argument>"(?:\\.|[^"\\])*"|[a-zA-Z_]\w*)\s*\)\s*;\s*$/;
    
    const match = trimmedLine.match(chatimpuRegex);

    if (!match) {
        return { 
            status: 'INVALID_SYNTAX', 
            error: "Syntax error in CHATIMPU. Expected format: CHATIMPU(variable) or CHATIMPU(\"text\"). Expressions are not allowed." 
        };
    }

    const { argument } = match.groups;


    if (argument.startsWith('"')) {
        return { 
            status: 'VALID', 
            data: { type: 'literal', value: argument } 
        };
    } else {
        
        if (lookup(argument) === null) {
            return { 
                status: 'SEMANTIC_ERROR', 
                error: `Undeclared Variable: Cannot print '${argument}' because it has not been declared.` 
            };
        }
        
       
        return { 
            status: 'VALID', 
            data: { type: 'variable', name: argument } 
        };
    }
}
//////////////////////////////////////////////////////////////////////////////////


function validateElaitheHeader(line, lookupFn) {
    const trimmedLine = line.trim();

    if (!trimmedLine.startsWith('ELAITHE')) {
        return { status: 'NOT_ELAITHE' };
    }

  
    const determineType = (expr) => {
        expr = expr.trim();
        
        if (/^\d+$/.test(expr)) {
            return { success: true, type: 'ANKHE' };
        }

        if (/^"[^"]*:?"$/.test(expr)) {
            return { success: true, type: 'VARTTAI' };
        }

       
        const variableInfo = lookupFn(expr);
        if (variableInfo) {
            return { success: true, type: variableInfo.type };
        }

        
        return { success: false, error: `Undeclared variable '${expr}' used in condition.` };
    };

    const headerRegex = /^\s*ELAITHE\s*\(\s*(?<operand1>\S+)\s*(?<operator>==|!=|<=|>=|<|>)\s*(?<operand2>\S+)\s*\)\s*\[\s*$/;
    const match = trimmedLine.match(headerRegex);

    if (!match) {
        return { 
            status: 'INVALID_SYNTAX', 
            error: "Syntax error in ELAITHE header. Expected: ELAITHE (value operator value) ["
        };
    }

    const { operand1, operator, operand2 } = match.groups;

   
    const op1Result = determineType(operand1);
    const op2Result = determineType(operand2);

   
    if (!op1Result.success) return { status: 'SEMANTIC_ERROR', error: op1Result.error };
    if (!op2Result.success) return { status: 'SEMANTIC_ERROR', error: op2Result.error };

    const type1 = op1Result.type;
    const type2 = op2Result.type;
    

    if (type1 !== type2) {
        return {
            status: 'SEMANTIC_ERROR',
            error: `Type Mismatch: Cannot compare type ${type1} with type ${type2} in condition.`
        };
    }
    
    
    return { status: 'VALID' };
}
////////////////////////////////////////////////////////////////////////////////


function validateBlockEnd(line) {
    const trimmedLine = line.trim();

   
    if (!trimmedLine.startsWith(']')) {
        return { status: 'NOT_A_BLOCK_END' };
    }

    
    const elseRegex = /^\s*]\s*ALAITHE\s*\[\s*$/;
    if (elseRegex.test(trimmedLine)) {
        return {
            status: 'VALID',
            data: {
                type: 'end_with_else' 
            }
        };
    }


    const endOnlyRegex = /^\s*]\s*$/;
    if (endOnlyRegex.test(trimmedLine)) {
        return {
            status: 'VALID',
            data: {
                type: 'end_only' 
            }
        };
    }

   
    return {
        status: 'INVALID_SYNTAX',
        error: "Malformed block-closing statement. Expected ']' or '] ALAITHE ['."
    };
}

///////////////////////////////////////////////////////////////////////////////
function ece_cmd(command){

     const result=validatePadam(command);
     if(result.status=="VALID"){
                declare(result.data.variable, { 
                type: result.data.type, 
                value: result.data.value 
            });  
            
            return {status:"next"};
     }
     else if(result.status=="SEMANTIC_ERROR"){

              return {status:"Error"};
     }

     ///////////////////////////////////////////////////

     const result1=validateCheppu(command);
     if(result1.status=="VALID"){
  
            
            return {status:"next"};
     }
     else if(result1.status=="SEMANTIC_ERROR"){

              return {status:"Error"};
     }
     ///////////////////////////////////////////////////
     const result2=validateAssignment(command);
     if(result2.status=="VALID"){

            
            return {status:"next"};
     }
     else if(result2.status=="SEMANTIC_ERROR"){

              return {status:"Error"};
     }

     ///////////////////////////////////////////////////
     const result3=validateChatimpu(command);
     if(result3.status=="VALID"){

            
            return {status:"next"};
     }
     else if(result3.status=="SEMANTIC_ERROR"){

              return {status:"Error"};
     }
     ///////////////////////////////////////////////////

      const result4=validateElaitheHeader(command);
         if(result4.status=="VALID"){
               enterScope();
               bracketStack.push(1);
               return {status:"next"};
         }
         else if(result4.status=="SEMANTIC_ERROR"){
               return {status:"Error"};
         }

    //////////////////////////////////////////////////////

     const result5=validateBlockEnd(command);
       if(result5.status=="VALID"){
              if(bracketStack.length==0){
                return {status:"Error",type:"NO_OPEN_["}
              }
               exitScope();
               if(result5.data.type=="end_with_else"){
                  enterScope();
               }
               return {status:"next"};
         }
         else if(result5.status=="SEMANTIC_ERROR"){
               return {status:"Error"};
         }
     /////////////////////////////////////////////////////
   


           

}

// const V=validatePadam("PADAM a:ANKHE=10;");
//                 declare(V.data.variable, { 
//                 type: V.data.type, 
//                 value: V.data.value })

// console.log(validateChatimpu('CHATIMPU("Hello World");'));
// console.log(validateChatimpu('CHATIMPU(a);'));

//////////////////////////////////////////////////////////////////////
// Assume 'lookup' and 'declare' functions exist.

console.log()



