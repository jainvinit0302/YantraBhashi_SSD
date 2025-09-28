// File: interpreter.js
class YantrabhashaInterpreter {
    constructor() { this.scopeStack = [new Map()]; this.output = []; }
    enterScope() { this.scopeStack.push(new Map()); }
    exitScope() { if (this.scopeStack.length > 1) this.scopeStack.pop(); }
    declare(name, info) { const scope = this.scopeStack[this.scopeStack.length - 1]; if (scope.has(name)) return { success: false, error: `Variable '${name}' already declared.` }; scope.set(name, info); return { success: true }; }
    lookup(name) { for (let i = this.scopeStack.length - 1; i >= 0; i--) { if (this.scopeStack[i].has(name)) return this.scopeStack[i].get(name); } return null; }
    update(name, value) { for (let i = this.scopeStack.length - 1; i >= 0; i--) { if (this.scopeStack[i].has(name)) { const info = this.scopeStack[i].get(name); info.value = value; return { success: true }; } } return { success: false, error: `Variable '${name}' not found.` }; }

    run(programString, inputs = []) {
        this.scopeStack = [new Map()]; this.output = []; const inputIndexRef = { value: 0 };
        try {
            const lines = programString.split('\n').map(line => line.trim()).filter(Boolean);
            const blueprint = this.analyzeBlockStructure(lines);
            const result = this.execute(blueprint, inputs, inputIndexRef);
            if (!result.success) { return { success: false, error: result.error, output: this.output }; }
            return { success: true, output: this.output, error: null };
        } catch (e) { return { success: false, error: `Critical Runtime Error: ${e.message}`, output: this.output }; }
    }

    execute(blueprint, inputList, inputIndexRef, startIndex = 0, endIndex = blueprint.length) {
        let pc = startIndex;
        while (pc < endIndex) {
            const command = blueprint[pc]; if (!command) { pc++; continue; }
            const line = command.lineText; let result = { success: true };
            if (command.type === 'ELAITHE') {
                this.enterScope();
                const condition = line.substring(line.indexOf('(') + 1, line.lastIndexOf(')'));
                const evalResult = this.evaluateExpression(condition); if (!evalResult.success) return evalResult;
                const ifBodyEnd = command.elseBodyStartLine !== null ? command.elseBodyStartLine : command.constructEndLine;
                if (evalResult.value) { result = this.execute(blueprint, inputList, inputIndexRef, pc + 1, ifBodyEnd); }
                else if (command.elseBodyStartLine !== null) { result = this.execute(blueprint, inputList, inputIndexRef, command.elseBodyStartLine + 1, command.constructEndLine); }
                if (!result.success) return result;
                this.exitScope(); pc = command.constructEndLine;
            } else if (command.type === 'MALLI_MALLI') {
                this.enterScope();
                const header = line.substring(line.indexOf('(') + 1, line.lastIndexOf(')'));
                const parts = header.split(';').map(p => p.trim());
                this.executeStatement(`PADAM ${parts[0]};`, inputList, inputIndexRef);
                while (true) {
                    const condResult = this.evaluateExpression(parts[1]); if (!condResult.success) return condResult; if (!condResult.value) break;
                    result = this.execute(blueprint, inputList, inputIndexRef, pc + 1, command.constructEndLine); if (!result.success) return result;
                    this.executeStatement(parts[2] + ";", inputList, inputIndexRef);
                }
                this.exitScope(); pc = command.constructEndLine;
            } else if (command.type !== 'ELSE' && command.type !== 'BLOCK_END') {
                result = this.executeStatement(line, inputList, inputIndexRef); if (!result.success) return { ...result, error: `${result.error} on line ${pc + 1}` };
            }
            pc++;
        }
        return { success: true };
    }
    
    executeStatement(line, inputList, inputIndexRef) {
        if (line.startsWith('PADAM')) { const match = line.match(/PADAM\s+(?<variable>[a-zA-Z_]\w*)\s*:\s*(?<type>ANKHE|VARTTAI)(?:\s*=\s*(?<value>.+))?;/); if (!match) return { success: false, error: 'Invalid PADAM syntax' }; const { variable, type, value } = match.groups; let finalValue; if (value) { const evalResult = this.evaluateExpression(value); if (!evalResult.success) return evalResult; finalValue = evalResult.value; } return this.declare(variable, { type, value: finalValue }); }
        else if (line.startsWith('CHATIMPU')) { const match = line.match(/CHATIMPU\((.*)\);/); if (!match) return { success: false, error: 'Invalid CHATIMPU syntax' }; const evalResult = this.evaluateExpression(match[1]); if (!evalResult.success) return evalResult; this.output.push(evalResult.value); }
        else if (line.startsWith('CHEPPU')) { const match = line.match(/CHEPPU\((.*)\);/); if (!match) return { success: false, error: 'Invalid CHEPPU syntax' }; const varName = match[1].trim(); if (inputIndexRef.value >= inputList.length) return { success: false, error: "Not enough inputs provided for CHEPPU" }; const inputVal = inputList[inputIndexRef.value++]; const varInfo = this.lookup(varName); return this.update(varName, varInfo.type === 'ANKHE' ? Number(inputVal) : String(inputVal)); }
        else if (line.includes('=')) { const parts = line.split('=').map(p => p.replace(';', '').trim()); const varName = parts[0]; const evalResult = this.evaluateExpression(parts[1]); if (!evalResult.success) return evalResult; return this.update(varName, evalResult.value); }
        return { success: true };
    }

    evaluateExpression(expression) {
        expression = String(expression).trim();
        const getValue = (part) => { part = part.trim(); if (/^\d+$/.test(part)) return { success: true, value: Number(part) }; if (part.startsWith('"') && part.endsWith('"')) return { success: true, value: part.slice(1, -1) }; const varInfo = this.lookup(part); if (varInfo === null) return { success: false, error: `Variable '${part}' not found` }; if (varInfo.value === undefined) return { success: false, error: `Variable '${part}' was used before a value was assigned.` }; return { success: true, value: varInfo.value }; };
        const match = expression.match(/(.+?)\s*(==|!=|<=|>=|<|>|\+|-|\*|\/)\s*(.+)/); if (!match) return getValue(expression); const [, op1, operator, op2] = match; const left = getValue(op1); if (!left.success) return left; const right = getValue(op2); if (!right.success) return right;
        switch (operator) { case '+': return { success: true, value: left.value + right.value }; case '-': return { success: true, value: left.value - right.value }; case '*': return { success: true, value: left.value * right.value }; case '/': return { success: true, value: Math.floor(left.value / right.value) }; case '==': return { success: true, value: left.value == right.value }; case '!=': return { success: true, value: left.value != right.value }; case '>': return { success: true, value: left.value > right.value }; case '<': return { success: true, value: left.value < right.value }; case '>=': return { success: true, value: left.value >= right.value }; case '<=': return { success: true, value: left.value <= right.value }; default: return { success: false, error: `Unknown operator: ${operator}` }; }
    }
    
    analyzeBlockStructure(lines) {
        const blockInfoList = []; const blockStack = [];
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i]; const entry = { lineNumber: i, lineText: line, elseBodyStartLine: null, constructEndLine: null };
            if (line.startsWith('ELAITHE')) { entry.type = 'ELAITHE'; blockInfoList.push(entry); blockStack.push(entry); }
            else if (line.startsWith('MALLI-MALLI')) { entry.type = 'MALLI_MALLI'; blockInfoList.push(entry); blockStack.push(entry); }
            else if (line.startsWith('] ALAITHE [')) { entry.type = 'ELSE'; blockInfoList.push(entry); const currentBlock = blockStack[blockStack.length - 1]; if (currentBlock && currentBlock.type === 'ELAITHE') { currentBlock.elseBodyStartLine = i; } }
            else if (line === ']') { entry.type = 'BLOCK_END'; blockInfoList.push(entry); if (blockStack.length > 0) { const finishedBlock = blockStack.pop(); finishedBlock.constructEndLine = i; } }
            else { entry.type = 'STATEMENT'; blockInfoList.push(entry); }
        }
        return blockInfoList;
    }
}