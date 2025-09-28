// validator.js (patched)
// YantraBhasha single-file validator compatible with app.js
(function (global) {
  // Expose as global YantraBhashaValidator
  class YantraBhashaValidator {
    constructor() {
      // nothing to init
    }

    // Primary entry: validate(sourceCodeString)
    validate(code) {
      // Prepare
      this.scopeStack = [new Map()];
      this.bracketStack = [];
      this.errors = [];
      this.warnings = [];
      this.console = [];

      // Split by lines and keep original line numbers
      const rawLines = code.replace(/\r\n/g, "\n").split("\n");
      // keep lines but replace tabs with spaces
      const lines = rawLines.map(l => l.replace(/\t/g, '    '));

      // iterate each line
      for (let i = 0; i < lines.length; i++) {
        const raw = lines[i];
        const trimmed = raw.trim();
        if (trimmed === "") continue; // skip empty lines silently

        this._processLine(trimmed, i + 1);
      }

      // final bracket balance check
      if (this.bracketStack.length !== 0) {
        const top = this.bracketStack[this.bracketStack.length - 1];
        const originLine = top && top.line ? top.line : null;
        this.errors.push({
          line: originLine,
          message: `Unclosed block(s): missing ${this.bracketStack.length} ']' closing bracket(s).` + (originLine ? ` Opening block at line ${originLine}.` : '')
        });
      }

      // collect declared variables (from all scopes, but show most recent)
      const varMap = new Map();
      for (let s = 0; s < this.scopeStack.length; s++) {
        for (const [name, info] of this.scopeStack[s].entries()) {
          // Keep most recent value & type
          varMap.set(name, { type: info.type, value: info.value });
        }
      }
      // convert to array of [name, type, value]
      const variables = Array.from(varMap.entries()).map(([name, info]) => [name, info.type, info.value]);

      return {
        errors: this.errors,
        warnings: this.warnings,
        variables,
        console: this.console
      };
    }

    // ---------------------------
    // helper utilities and validators
    // ---------------------------
    _hasSemicolon(line) {
      if (typeof line !== 'string') return false;
      return line.trim().endsWith(';');
    }

    _enterScope() { this.scopeStack.push(new Map()); }
    _exitScope() { if (this.scopeStack.length > 1) this.scopeStack.pop(); }


    _getExpressionType(exprRaw, lineNo) {
      const expr = exprRaw.trim();
      if (/^-?\d+$/.test(expr)) return { success: true, type: 'ANKHE' };
      if (/^"(?:\\.|[^"\\])*"$/.test(expr)) return { success: true, type: 'VARTTAI' };
      const info = this._lookup(expr);
      if (info) return { success: true, type: info.type };
      return { success: false, error: `Semantic Error: Variable '${expr}' was used before it was declared.` };
    }

    // ---------------------------
    // Individual validators (return status objects)
    // ---------------------------
    _validatePadam(line) {
      if (!line.startsWith('PADAM')) return { status: 'NOT_PADAM' };
      const padamRegex = /^\s*PADAM\s+(?<variable>[a-zA-Z_]\w*)\s*:\s*(?<type>ANKHE|VARTTAI)(?:\s*=\s*(?<value>-?\d+|"(?:\\.|[^"\\])*"))?\s*;\s*$/;
      const match = line.match(padamRegex);
      if (!match) {
        if (!this._hasSemicolon(line)) return { status: 'INVALID_SYNTAX', error: "Missing semicolon (;) at the end of the PADAM statement." };
        return { status: 'INVALID_SYNTAX', error: "Syntax error in PADAM declaration." };
      }
      const { variable, type, value } = match.groups;
      if (value !== undefined) {
        const isString = value.startsWith('"');
        if (type === 'ANKHE' && isString) return { status: 'SEMANTIC_ERROR', error: `Type Mismatch: Cannot assign a VARTTAI (string) to an ANKHE variable '${variable}'.` };
        if (type === 'VARTTAI' && !isString) return { status: 'SEMANTIC_ERROR', error: `Type Mismatch: Cannot assign an ANKHE (integer) to a VARTTAI variable '${variable}'.` };
        return { status: 'VALID', data: { variable, type, value } };
      } else {
        return { status: 'VALID', data: { variable, type, value: undefined } };
      }
    }

    _declare(variableName, info) {
      const currentScope = this.scopeStack[this.scopeStack.length - 1];
      if (currentScope.has(variableName)) {
        return { success: false, error: `Semantic Error: Variable '${variableName}' has already been declared in this scope.` };
      }
      // Track usage & last assignment for warnings
      currentScope.set(variableName, { ...info, used: false, lastAssigned: undefined });
      return { success: true };
    }

    _lookup(variableName) {
      for (let i = this.scopeStack.length - 1; i >= 0; i--) {
        if (this.scopeStack[i].has(variableName)) {
          const info = this.scopeStack[i].get(variableName);
          info.used = true; // mark as used
          return info;
        }
      }
      return null;
    }


    _validateCheppu(line) {
      if (!line.startsWith('CHEPPU')) return { status: 'NOT_CHEPPU' };
      const cheppuRegex = /^\s*CHEPPU\s*\(\s*(?<variable>[a-zA-Z_]\w*)\s*\)\s*;\s*$/;
      const match = line.match(cheppuRegex);
      if (!match) {
        if (!this._hasSemicolon(line)) return { status: 'INVALID_SYNTAX', error: "Missing semicolon (;) at the end of the CHEPPU statement." };
        return { status: 'INVALID_SYNTAX', error: "Syntax error in CHEPPU statement. Expected format: CHEPPU(variable);" };
      }
      const { variable } = match.groups;
      const variableInfo = this._lookup(variable);
      if (variableInfo === null) return { status: 'SEMANTIC_ERROR', error: `Undeclared Variable: Cannot get input for '${variable}' because it has not been declared.` };
      return { status: 'VALID', data: { command: 'CHEPPU', variable } };
    }

    _validateAssignment(line) {
      if (!/(?<![=<>!])=(?![=])/.test(line)) return { status: 'NOT_ASSIGNMENT' };
      const assignRegex = /^\s*(?<lhsVar>[a-zA-Z_]\w*)\s*=\s*(?<rhsExpr>.*);\s*$/;
      const match = line.match(assignRegex);
      if (!match) {
        if (!this._hasSemicolon(line)) return { status: 'INVALID_SYNTAX', error: "Missing semicolon (;) at the end of the assignment statement." };
        return { status: 'INVALID_SYNTAX', error: "Invalid syntax for assignment statement." };
      }
      const { lhsVar, rhsExpr } = match.groups;
      const lhsInfo = this._lookup(lhsVar);
      if (!lhsInfo) return { status: 'SEMANTIC_ERROR', error: `Undeclared variable '${lhsVar}' used in assignment.` };

      // simple binary operators only
      const operators = ['+', '-', '*', '/'];
      let rhsType;
      let foundOp = null;
      for (let op of operators) {
        // only treat first occurrence
        if (rhsExpr.includes(op)) { foundOp = op; break; }
      }
      if (foundOp) {
        const parts = rhsExpr.split(foundOp);
        if (parts.length !== 2) return { status: 'INVALID_SYNTAX', error: 'Malformed expression. Only simple binary operations are supported.' };
        const left = this._getExpressionType(parts[0]);
        const right = this._getExpressionType(parts[1]);
        if (!left.success) return { status: 'SEMANTIC_ERROR', error: left.error };
        if (!right.success) return { status: 'SEMANTIC_ERROR', error: right.error };
        if (left.type === 'ANKHE' && right.type === 'ANKHE') rhsType = 'ANKHE';
        else return { status: 'SEMANTIC_ERROR', error: `Type Mismatch: Operator '${foundOp}' can only be used between two ANKHE types.` };
      } else {
        const res = this._getExpressionType(rhsExpr);
        if (!res.success) return { status: 'SEMANTIC_ERROR', error: res.error };
        rhsType = res.type;
      }

      if (lhsInfo.type !== rhsType) return { status: 'SEMANTIC_ERROR', error: `Type Mismatch: Cannot assign a value of type ${rhsType} to variable '${lhsVar}' of type ${lhsInfo.type}.` };
      return { status: 'VALID' };
    }

    _validateChatimpu(line) {
      if (!line.startsWith('CHATIMPU')) return { status: 'NOT_CHATIMPU' };
      const chatimpuRegex = /^\s*CHATIMPU\s*\(\s*(?<argument>"(?:\\.|[^"\\])*"|[a-zA-Z_]\w*)\s*\)\s*;\s*$/;
      const match = line.match(chatimpuRegex);
      if (!match) {
        if (!this._hasSemicolon(line)) return { status: 'INVALID_SYNTAX', error: "Missing semicolon (;) at the end of the CHATIMPU statement." };
        return { status: 'INVALID_SYNTAX', error: "Syntax error in CHATIMPU. Expected format: CHATIMPU(variable_or_literal);" };
      }

      const { argument } = match.groups;

      // Literal string -> always valid
      if (argument.startsWith('"')) {
        return { status: 'VALID', data: { type: 'literal', value: argument } };
      }

      // Variable: check declaration and initialization
      const info = this._lookup(argument);
      if (info === null) {
        return { status: 'SEMANTIC_ERROR', error: `Undeclared Variable: Cannot print '${argument}' because it has not been declared.` };
      }
      if (info.value === undefined) {
        return { status: 'SEMANTIC_ERROR', error: `Variable '${argument}' was used before a value was assigned.` };
      }

      return { status: 'VALID', data: { type: 'variable', name: argument } };
    }


    _validateElaitheHeader(line) {
      if (!line.startsWith('ELAITHE')) return { status: 'NOT_ELAITHE' };
      const headerRegex = /^\s*ELAITHE\s*\(\s*(?<operand1>\S+)\s*(?<operator>==|!=|<=|>=|<|>)\s*(?<operand2>\S+)\s*\)\s*\[\s*$/;
      const match = line.match(headerRegex);
      if (!match) return { status: 'INVALID_SYNTAX', error: "Syntax error in ELAITHE header. Expected: ELAITHE (value operator value) [" };
      const { operand1, operator, operand2 } = match.groups;
      const op1Result = this._getExpressionType(operand1);
      const op2Result = this._getExpressionType(operand2);
      if (!op1Result.success) return { status: 'SEMANTIC_ERROR', error: op1Result.error };
      if (!op2Result.success) return { status: 'SEMANTIC_ERROR', error: op2Result.error };
      if (op1Result.type !== op2Result.type) return { status: 'SEMANTIC_ERROR', error: `Type Mismatch: Cannot compare type ${op1Result.type} with type ${op2Result.type} in condition.` };
      return { status: 'VALID' };
    }

    _validateBlockEnd(line) {
      if (!line.startsWith(']')) return { status: 'NOT_A_BLOCK_END' };
      const elseRegex = /^\s*]\s*ALAITHE\s*\[\s*$/;
      if (elseRegex.test(line)) return { status: 'VALID', data: { type: 'end_with_else' } };
      const endOnlyRegex = /^\s*]\s*$/;
      if (endOnlyRegex.test(line)) return { status: 'VALID', data: { type: 'end_only' } };
      return { status: 'INVALID_SYNTAX', error: "Malformed block-closing statement. Expected ']' or '] ALAITHE ['." };
    }

    _validateMalliMalliHeader(line) {
      if (!line.startsWith('MALLI-MALLI')) return { status: 'NOT_MALLI_MALLI' };

      const mainRegex = /^\s*MALLI-MALLI\s*\((?<content>.*)\)\s*\[\s*$/;
      const mainMatch = line.match(mainRegex);
      if (!mainMatch) {
          return { status: 'INVALID_SYNTAX', error: "Malformed MALLI-MALLI structure. Expected: MALLI-MALLI (...) [" };
      }

      const parts = mainMatch.groups.content.split(';').map(p => p.trim());
      if (parts.length !== 3) {
          return { status: 'INVALID_SYNTAX', error: "MALLI-MALLI loop requires three parts: initialization; condition; update." };
      }

      // Parse initialization (PADAM i:ANKHE = value) — only *validate* here, do NOT declare
      const initPart = parts[0];
      const padamRegex = /^\s*PADAM\s+(?<variable>[a-zA-Z_]\w*)\s*:\s*ANKHE\s*=\s*(?<value>-?\d+)\s*$/;
      const initMatch = initPart.match(padamRegex);
      if (!initMatch) {
          return { status: 'SEMANTIC_ERROR', error: "Loop initialization must be a PADAM statement initializing an ANKHE variable (e.g., PADAM i:ANKHE = 0)." };
      }

      const loopVar = initMatch.groups.variable;
      const loopValue = initMatch.groups.value;

      // Helper that treats the declared loop variable as available *for validation only*
      const internalLookup = (varName) => {
          if (varName === loopVar) return { type: 'ANKHE', value: Number(loopValue) };
          return this._lookup(varName);
      };
      const determineType = (expr) => {
          if (/^-?\d+$/.test(expr.trim())) return { success: true, type: 'ANKHE' };
          const result = internalLookup(expr.trim());
          if (result) return { success: true, type: result.type };
          return { success: false, error: `Undeclared variable '${expr}' in loop condition.` };
      };

      // Validate condition
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

      // Validate update (must use the loop variable)
      const updatePart = parts[2];
      const updateRegex = new RegExp(`^\\s*${loopVar}\\s*=\\s*${loopVar}\\s*([+\\-])\\s*1\\s*$`);
      if (!updateRegex.test(updatePart)) {
          return { status: 'SEMANTIC_ERROR', error: `Loop update must be of the form '${loopVar} = ${loopVar} + 1' or '- 1'.` };
      }

      // return VALID but do not declare the variable here
      return { status: 'VALID', data: { variable: loopVar, type: 'ANKHE', value: Number(loopValue) } };
    }

    // central per-line processor: uses validators in order
    _processLine(line, lineNo) {
      const validationOrder = [
        this._validatePadam.bind(this),
        this._validateCheppu.bind(this),
        this._validateChatimpu.bind(this),
        this._validateElaitheHeader.bind(this),
        this._validateMalliMalliHeader.bind(this),
        this._validateBlockEnd.bind(this),
        this._validateAssignment.bind(this)
      ];

      for (const validator of validationOrder) {
        const result = validator(line);
        // If validator didn't apply, it will return a NOT_* status - continue
        if (!result || (result.status && String(result.status).startsWith('NOT_'))) {
          continue;
        }

        // VALID handling
        if (result.status === 'VALID') {
          // handle based on line content
          if (line.startsWith('ELAITHE')) {
            // open if scope and push a marker for if-block (1)
            this._enterScope();
            this.bracketStack.push({ type: 1, line: lineNo });
            return { status: 'ok' };
          } else if (line.startsWith('MALLI-MALLI')) {
            // enter loop scope, declare loop variable in that (temporary) scope
            this._enterScope();
            const declareResult = this._declare(result.data.variable, { type: result.data.type, value: result.data.value });
            if (!declareResult.success) {
              this.errors.push({ line: lineNo, message: declareResult.error });
            }
            this.bracketStack.push({ type: 3, line: lineNo }); // loop marker with line
            return { status: 'ok' };
          } else if (line.startsWith(']')) {
            // block end handling
            if (this.bracketStack.length === 0) {
              this.errors.push({ line: lineNo, message: `Closing bracket ']' has no matching opening block.` });
              return { status: 'ok' };
            }
            const vd = result.data;
            if (vd && vd.type === 'end_with_else') {
              // end with else: pop the current block, exit its scope, then prepare else scope
              const popped = this.bracketStack.pop();
              this._exitScope();
              if (!popped || popped.type !== 1) {
                // must follow an ELAITHE (if)
                this.errors.push({ line: lineNo, message: `'ALAITHE' must follow an 'ELAITHE' block.` });
                return { status: 'ok' };
              }
              // start else scope
              this._enterScope();
              this.bracketStack.push({ type: 2, line: lineNo }); // else marker with originating line
              return { status: 'ok' };
            } else {
              // end only (normal close). exit current scope and pop one bracket marker
              this._exitScope();
              this.bracketStack.pop();
              return { status: 'ok' };
            }
          } else if (line.startsWith('PADAM')) {
            // declare variable in current scope
            const declareResult = this._declare(result.data.variable, { type: result.data.type, value: result.data.value !== undefined ? (result.data.type === 'ANKHE' ? Number(result.data.value) : result.data.value.replace(/^"|"$/g, '')) : undefined });
            if (!declareResult.success) {
              this.errors.push({ line: lineNo, message: declareResult.error });
            }
            return { status: 'ok' };
          } else if (line.startsWith('CHEPPU')) {
            // valid cheppu (input) - note as console input requirement
            this.console.push({ type: 'input', line: lineNo, value: result.data.variable });
            return { status: 'ok' };
          } else if (line.startsWith('CHATIMPU')) {
            // add to console outputs if literal or variable
            if (result.data.type === 'literal') {
              // strip quotes for display
              const val = result.data.value.replace(/^"|"$/g, '');
              this.console.push({ type: 'output', line: lineNo, value: val });
            } else if (result.data.type === 'variable') {
              // If variable exists, show as output placeholder
              const info = this._lookup(result.data.name);
              let display = `(variable ${result.data.name})`;
              if (info && info.value !== undefined) display = info.value;
              this.console.push({ type: 'output', line: lineNo, value: display });
            }
            return { status: 'ok' };
          } else {
            // assignment or other constructs we considered valid (e.g., assignment)
            if (/(?<![=<>!])=(?![=])/.test(line)) {
              // assignment: update variable value in nearest scope
              const assignRegex = /^\s*(?<lhsVar>[a-zA-Z_]\w*)\s*=\s*(?<rhsExpr>.*);\s*$/;
              const match = line.match(assignRegex);
              if (match) {
                const { lhsVar, rhsExpr } = match.groups;
                const lhsInfo = this._lookup(lhsVar);
                if (!lhsInfo) {
                  this.errors.push({ line: lineNo, message: `Undeclared variable '${lhsVar}' used in assignment.` });
                } else {
                  // try to evaluate constant assignment (simple)
                  const trimmed = rhsExpr.trim();
                  if (/^-?\d+$/.test(trimmed) && lhsInfo.type === 'ANKHE') {
                    lhsInfo.value = Number(trimmed);
                  } else if (/^"(?:\\.|[^"\\])*"$/.test(trimmed) && lhsInfo.type === 'VARTTAI') {
                    lhsInfo.value = trimmed.slice(1, -1);
                  } else {
                    // either variable or expression: try to resolve a single variable
                    if (/^[a-zA-Z_]\w*$/.test(trimmed)) {
                      const ref = this._lookup(trimmed);
                      if (!ref) {
                        this.errors.push({ line: lineNo, message: `Undeclared variable '${trimmed}' used in assignment.` });
                      } else if (ref.type !== lhsInfo.type) {
                        this.errors.push({ line: lineNo, message: `Type Mismatch: Cannot assign ${ref.type} to ${lhsInfo.type}.` });
                      } else {
                        lhsInfo.value = ref.value;
                      }
                    } else {
                      // complex expressions not evaluated here; we already validated types earlier
                      // leave as-is (we could try parse & evaluate but unnecessary for validator)
                    }
                  }
                }
              }
            }
            return { status: 'ok' };
          }
        }

        // if semantically or syntactically invalid, report with line number
        if (result.status === 'INVALID_SYNTAX' || result.status === 'SEMANTIC_ERROR') {
          this.errors.push({ line: lineNo, message: result.error });
          return { status: 'ok' };
        }

        // else continue to next validator
      }

      // If no validator produced a meaningful result (i.e., all returned NOT_*), then report unrecognized syntax
      this.errors.push({ line: lineNo, message: "Invalid or unrecognized syntax." });
      return { status: 'ok' };
    }
  }


  // export to global
  global.YantraBhashaValidator = YantraBhashaValidator;
})(window);


// ----------------- validate(code) wrapper for app integration -----------------
function validate(code) {
  const validator = new YantraBhashaValidator();
  // ensure code is a string and preserve empty input behavior
  return validator.validate(String(code || ""));
}
