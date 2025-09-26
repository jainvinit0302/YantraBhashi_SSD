/**
 * Yantrabhasha Programming Language Validator
 * Core validation logic for syntax and semantic analysis
 */

class YantraBhashaValidator {
    constructor() {
        this.variables = new Map();
        this.errors = [];
        this.warnings = [];
        this.consoleOutput = [];
        this.reservedWords = [
            'PADAM', 'ANKHE', 'VARTTAI', 'ELAITHE', 
            'ALAITHE', 'MALLI-MALLI', 'CHATIMPU', 'CHEPPU'
        ];
        this.currentLine = 0;
    }

    /**
     * Main validation method
     * @param {string} code - The Yantrabhasha code to validate
     * @returns {object} Validation results
     */
    validate(code) {
        this.reset();
        const lines = code.split('\n');
        
        for (let i = 0; i < lines.length; i++) {
            this.currentLine = i + 1;
            const line = lines[i].trim();
            
            // Skip empty lines and comments
            if (line === '' || line.startsWith('#')) continue;
            
            this.validateLine(line);
        }

        return {
            errors: this.errors,
            warnings: this.warnings,
            variables: Array.from(this.variables.entries()),
            console: this.consoleOutput
        };
    }

    /**
     * Reset validator state
     */
    reset() {
        this.variables.clear();
        this.errors = [];
        this.warnings = [];
        this.consoleOutput = [];
        this.currentLine = 0;
    }

    /**
     * Validate a single line of code
     * @param {string} line - Line to validate
     */
    validateLine(line) {
        const cleanLine = line.endsWith(';') ? line.slice(0, -1) : line;
        
        if (this.isVariableDeclaration(cleanLine)) {
            this.validateVariableDeclaration(line);
        } else if (this.isAssignment(cleanLine)) {
            this.validateAssignment(line);
        } else if (this.isConditional(cleanLine)) {
            this.validateConditional(line);
        } else if (this.isLoop(cleanLine)) {
            this.validateLoop(line);
        } else if (this.isPrint(cleanLine)) {
            this.validatePrint(line);
        } else if (this.isScan(cleanLine)) {
            this.validateScan(line);
        } else if (cleanLine === ']' || cleanLine === '] ALAITHE [') {
            // Block endings are valid
        } else if (cleanLine !== '') {
            this.addError(`Unknown statement: ${line}`);
        }
    }

    /**
     * Check if line is a variable declaration
     */
    isVariableDeclaration(line) {
        return line.startsWith('PADAM ') && line.includes(':');
    }

    /**
     * Validate variable declaration syntax and semantics
     */
    validateVariableDeclaration(line) {
        if (!line.endsWith(';')) {
            this.addError('Variable declaration must end with semicolon');
            return;
        }

        const cleanLine = line.slice(0, -1);
        const match = cleanLine.match(/PADAM\s+(\w+):(ANKHE|VARTTAI)(?:\s*=\s*(.+))?/);
        
        if (!match) {
            this.addError('Invalid variable declaration syntax');
            return;
        }

        const [, varName, type, value] = match;

        // Check reserved words
        if (this.reservedWords.includes(varName)) {
            this.addError(`Cannot use reserved word '${varName}' as variable name`);
            return;
        }

        // Check identifier format
        if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(varName)) {
            this.addError(`Invalid variable name '${varName}'. Must start with letter and contain only letters, digits, and underscores`);
            return;
        }

        // Check for redeclaration
        if (this.variables.has(varName)) {
            this.addWarning(`Variable '${varName}' already declared`);
        }

        // Store variable
        this.variables.set(varName, type);

        // Validate initial value if provided
        if (value) {
            this.validateValue(value, type, varName);
        }
    }

    /**
     * Validate value assignment based on type
     */
    validateValue(value, expectedType, varName) {
        value = value.trim();
        
        if (expectedType === 'ANKHE') {
            if (!/^-?\d+$/.test(value) && !this.isExpression(value)) {
                this.addError(`Invalid integer value for variable '${varName}': ${value}`);
            }
        } else if (expectedType === 'VARTTAI') {
            if (!value.startsWith('"') || !value.endsWith('"')) {
                this.addError(`String value must be enclosed in quotes for variable '${varName}': ${value}`);
            }
        }
    }

    /**
     * Check if value is a valid expression
     */
    isExpression(value) {
        const variables = Array.from(this.variables.keys()).join('|');
        const regex = new RegExp(`^[\\w\\s\\+\\-\\*\\/\\(\\)${variables}]+$`);
        return regex.test(value);
    }

    /**
     * Check if line is an assignment
     */
    isAssignment(line) {
        return /^\w+\s*=\s*.+/.test(line) && !line.startsWith('PADAM');
    }

    /**
     * Validate assignment statement
     */
    validateAssignment(line) {
        if (!line.endsWith(';')) {
            this.addError('Assignment must end with semicolon');
            return;
        }

        const cleanLine = line.slice(0, -1);
        const match = cleanLine.match(/^(\w+)\s*=\s*(.+)$/);
        
        if (!match) {
            this.addError('Invalid assignment syntax');
            return;
        }

        const [, varName, value] = match;

        // Check if variable is declared
        if (!this.variables.has(varName)) {
            this.addError(`Variable '${varName}' used before declaration`);
            return;
        }

        const varType = this.variables.get(varName);
        this.validateValue(value, varType, varName);
    }

    /**
     * Check if line is a conditional statement
     */
    isConditional(line) {
        return line.startsWith('ELAITHE ');
    }

    /**
     * Validate conditional statement
     */
    validateConditional(line) {
        const match = line.match(/ELAITHE\s*\((.+?)\)\s*\[/);
        
        if (!match) {
            this.addError('Invalid conditional syntax. Use: ELAITHE (condition) [');
            return;
        }

        const condition = match[1];
        this.validateCondition(condition);
    }

    /**
     * Validate condition expression
     */
    validateCondition(condition) {
        const operators = ['==', '!=', '<=', '>=', '<', '>'];
        let foundOperator = false;
        
        for (const op of operators) {
            if (condition.includes(op)) {
                foundOperator = true;
                const parts = condition.split(op);
                
                if (parts.length !== 2) {
                    this.addError(`Invalid condition: ${condition}`);
                    return;
                }

                parts.forEach(part => {
                    part = part.trim();
                    if (part.startsWith('"') && part.endsWith('"')) {
                        // String literal - valid
                    } else if (/^-?\d+$/.test(part)) {
                        // Integer literal - valid
                    } else if (/^[a-zA-Z]\w*$/.test(part)) {
                        // Variable - check if declared
                        if (!this.variables.has(part)) {
                            this.addError(`Variable '${part}' used in condition before declaration`);
                        }
                    } else {
                        this.addError(`Invalid operand in condition: ${part}`);
                    }
                });
                break;
            }
        }

        if (!foundOperator) {
            this.addError(`Condition must use comparison operators (==, !=, <, >, <=, >=): ${condition}`);
        }
    }

    /**
     * Check if line is a loop statement
     */
    isLoop(line) {
        return line.startsWith('MALLI-MALLI ');
    }

    /**
     * Validate loop statement
     */
    validateLoop(line) {
        const match = line.match(/MALLI-MALLI\s*\((.+?)\)\s*\[/);
        
        if (!match) {
            this.addError('Invalid loop syntax. Use: MALLI-MALLI (initialization; condition; update) [');
            return;
        }

        const loopParams = match[1];
        const parts = loopParams.split(';');
        
        if (parts.length !== 3) {
            this.addError('Loop must have three parts: initialization; condition; update');
            return;
        }

        // Validate initialization
        const init = parts[0].trim();
        if (init.startsWith('PADAM ')) {
            this.validateVariableDeclaration(init + ';');
        }

        // Validate condition
        const condition = parts[1].trim();
        this.validateCondition(condition);

        // Validate update
        const update = parts[2].trim();
        if (!this.isAssignment(update)) {
            this.addError('Loop update must be an assignment');
        }
    }

    /**
     * Check if line is a print statement
     */
    isPrint(line) {
        return line.startsWith('CHATIMPU(');
    }

    /**
     * Validate print statement
     */
    validatePrint(line) {
        if (!line.endsWith(';')) {
            this.addError('CHATIMPU statement must end with semicolon');
            return;
        }

        const match = line.match(/CHATIMPU\((.+?)\);/);
        
        if (!match) {
            this.addError('Invalid CHATIMPU syntax');
            return;
        }

        const arg = match[1].trim();
        
        if (arg.startsWith('"') && arg.endsWith('"')) {
            // String literal
            const output = arg.slice(1, -1);
            this.consoleOutput.push({ 
                type: 'output', 
                value: output, 
                line: this.currentLine 
            });
        } else if (/^[a-zA-Z]\w*$/.test(arg)) {
            // Variable
            if (!this.variables.has(arg)) {
                this.addError(`Variable '${arg}' used in CHATIMPU before declaration`);
            } else {
                this.consoleOutput.push({ 
                    type: 'output', 
                    value: `[${arg}]`, 
                    line: this.currentLine 
                });
            }
        } else {
            this.addError(`Invalid argument for CHATIMPU: ${arg}`);
        }
    }

    /**
     * Check if line is a scan statement
     */
    isScan(line) {
        return line.startsWith('CHEPPU(');
    }

    /**
     * Validate scan statement
     */
    validateScan(line) {
        if (!line.endsWith(';')) {
            this.addError('CHEPPU statement must end with semicolon');
            return;
        }

        const match = line.match(/CHEPPU\((\w+)\);/);
        
        if (!match) {
            this.addError('Invalid CHEPPU syntax');
            return;
        }

        const varName = match[1];
        
        if (!this.variables.has(varName)) {
            this.addError(`Variable '${varName}' used in CHEPPU before declaration`);
        } else {
            this.consoleOutput.push({ 
                type: 'input', 
                value: `Input required for ${varName}`, 
                line: this.currentLine 
            });
        }
    }

    /**
     * Add an error to the error list
     */
    addError(message) {
        this.errors.push({ 
            line: this.currentLine, 
            message, 
            type: 'error' 
        });
    }

    /**
     * Add a warning to the warning list
     */
    addWarning(message) {
        this.warnings.push({ 
            line: this.currentLine, 
            message, 
            type: 'warning' 
        });
    }
}