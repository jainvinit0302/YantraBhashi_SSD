/**
 * Yantrabhasha Programming Language Validator
 * Core validation logic for syntax and semantic analysis
 */

class YantraBhashaValidator {
    constructor() {
        this.variables = new Map();
        this.variablesValues = new Map();  // Track variable values here
        this.errors = [];
        this.warnings = [];
        this.consoleOutput = [];
        this.reservedWords = [
            'PADAM', 'ANKHE', 'VARTTAI', 'ELAITHE', 
            'ALAITHE', 'MALLI-MALLI', 'CHATIMPU', 'CHEPPU'
        ];
        this.currentLine = 0;
    }

    validate(code) {
        this.reset();
        const lines = code.split('\n');
        
        for (let i = 0; i < lines.length; i++) {
            this.currentLine = i + 1;
            const line = lines[i].trim();
            
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

    reset() {
        this.variables.clear();
        this.variablesValues.clear();
        this.errors = [];
        this.warnings = [];
        this.consoleOutput = [];
        this.currentLine = 0;
    }

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
            this.addError(
                `Unknown statement: ${line}`,
                'Check the syntax and ensure the statement follows Yantrabhasha rules.'
            );
        }
    }

    isVariableDeclaration(line) {
        return line.startsWith('PADAM ') && line.includes(':');
    }

    validateVariableDeclaration(line) {
        if (!line.endsWith(';')) {
            this.addError(
                'Variable declaration must end with semicolon',
                'Add a semicolon ";" at the end of the variable declaration.'
            );
            return;
        }

        const cleanLine = line.slice(0, -1);
        const match = cleanLine.match(/PADAM\s+(\w+):(ANKHE|VARTTAI)(?:\s*=\s*(.+))?/);
        
        if (!match) {
            this.addError(
                'Invalid variable declaration syntax',
                'Use syntax: PADAM variableName:TYPE [= value]; with TYPE as ANKHE or VARTTAI.'
            );
            return;
        }

        const [, varName, type, value] = match;

        if (this.reservedWords.includes(varName)) {
            this.addError(
                `Cannot use reserved word '${varName}' as variable name`,
                'Change the variable name to something not reserved.'
            );
            return;
        }

        if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(varName)) {
            this.addError(
                `Invalid variable name '${varName}'. Must start with letter and contain only letters, digits, and underscores`,
                'Rename the variable to start with a letter and allow letters, digits, or underscores only.'
            );
            return;
        }

        if (this.variables.has(varName)) {
            this.addWarning(`Variable '${varName}' already declared`);
        }

        this.variables.set(varName, type);

        if (value) {
            this.validateValue(value, type, varName);

            // Store initial value after trimming quotes if VARTTAI
            if (type === 'ANKHE') {
                const intVal = parseInt(value.trim());
                if (!isNaN(intVal)) {
                    this.variablesValues.set(varName, intVal);
                } else {
                    this.variablesValues.set(varName, value.trim()); // store expression as-is
                }
            } else if (type === 'VARTTAI') {
                this.variablesValues.set(varName, value.trim().slice(1, -1));
            }
        } else {
            this.variablesValues.set(varName, undefined);
        }
    }

    validateValue(value, expectedType, varName) {
        value = value.trim();

        if (expectedType === 'ANKHE') {
            if (!/^-?\d+$/.test(value) && !this.isExpression(value)) {
                this.addError(
                    `Invalid integer value for variable '${varName}': ${value}`,
                    'Assign only integer values or valid integer expressions to ANKHE variables.'
                );
            }
        } else if (expectedType === 'VARTTAI') {
            if (!value.startsWith('"') || !value.endsWith('"')) {
                this.addError(
                    `String value must be enclosed in quotes for variable '${varName}': ${value}`,
                    'Enclose string values in double quotes, e.g. "Hello".'
                );
            }
        }
    }

    isExpression(value) {
        const variables = Array.from(this.variables.keys()).join('|');
        const regex = new RegExp(`^[\\w\\s\\+\\-\\*\\/\\(\\)${variables}]+$`);
        return regex.test(value);
    }

    isAssignment(line) {
        return /^\w+\s*=\s*.+/.test(line) && !line.startsWith('PADAM');
    }

    validateAssignment(line) {
        if (!line.endsWith(';')) {
            this.addError(
                'Assignment must end with semicolon',
                'Add a semicolon ";" at the end of assignment statements.'
            );
            return;
        }

        const cleanLine = line.slice(0, -1);
        const match = cleanLine.match(/^(\w+)\s*=\s*(.+)$/);

        if (!match) {
            this.addError(
                'Invalid assignment syntax',
                'Use syntax: variableName = expression;'
            );
            return;
        }

        const [, varName, value] = match;

        if (!this.variables.has(varName)) {
            this.addError(
                `Variable '${varName}' used before declaration`,
                `Declare the variable '${varName}' before assigning a value.`
            );
            return;
        }

        const varType = this.variables.get(varName);
        this.validateValue(value, varType, varName);

        const valTrimmed = value.trim();

        // Store assigned value if obvious literal
        if (varType === 'ANKHE') {
            const intVal = parseInt(valTrimmed);
            if (!isNaN(intVal)) {
                this.variablesValues.set(varName, intVal);
            } else {
                this.variablesValues.set(varName, valTrimmed); 
            }
        } else if (varType === 'VARTTAI') {
            if (valTrimmed.startsWith('"') && valTrimmed.endsWith('"')) {
                this.variablesValues.set(varName, valTrimmed.slice(1, -1));
            } else {
                this.variablesValues.set(varName, undefined);
            }
        }
    }

    isConditional(line) {
        return line.startsWith('ELAITHE ');
    }

    validateConditional(line) {
        const match = line.match(/ELAITHE\s*\((.+?)\)\s*\[/);

        if (!match) {
            this.addError(
                'Invalid conditional syntax. Use: ELAITHE (condition) [',
                'Make sure conditionals follow syntax: ELAITHE (condition) [ ... ]'
            );
            return;
        }

        const condition = match[1];
        this.validateCondition(condition);
    }

    validateCondition(condition) {
        const operators = ['==', '!=', '<=', '>=', '<', '>'];
        let foundOperator = false;

        for (const op of operators) {
            if (condition.includes(op)) {
                foundOperator = true;
                const parts = condition.split(op);

                if (parts.length !== 2) {
                    this.addError(
                        `Invalid condition: ${condition}`,
                        'Conditions must have exactly two operands.'
                    );
                    return;
                }

                parts.forEach(part => {
                    part = part.trim();
                    if (part.startsWith('"') && part.endsWith('"')) {
                        // String literal - valid
                    } else if (/^-?\d+$/.test(part)) {
                        // Integer literal - valid
                    } else if (/^[a-zA-Z]\w*$/.test(part)) {
                        if (!this.variables.has(part)) {
                            this.addError(
                                `Variable '${part}' used in condition before declaration`,
                                `Declare variable '${part}' before using it in conditions.`
                            );
                        }
                    } else {
                        this.addError(
                            `Invalid operand in condition: ${part}`,
                            'Operands must be declared variables, integer literals, or string literals in quotes.'
                        );
                    }
                });
                break;
            }
        }

        if (!foundOperator) {
            this.addError(
                `Condition must use comparison operators (==, !=, <, >, <=, >=): ${condition}`,
                'Use one of the supported comparison operators in conditions.'
            );
        }
    }

    isLoop(line) {
        return line.startsWith('MALLI-MALLI ');
    }

    validateLoop(line) {
        const match = line.match(/MALLI-MALLI\s*\((.+?)\)\s*\[/);

        if (!match) {
            this.addError(
                'Invalid loop syntax. Use: MALLI-MALLI (initialization; condition; update) [',
                'Ensure loops have initialization, condition, and update parts separated by semicolons and followed by "[".'
            );
            return;
        }

        const loopParams = match[1];
        const parts = loopParams.split(';');

        if (parts.length !== 3) {
            this.addError(
                'Loop must have three parts: initialization; condition; update',
                'Provide exactly three parts separated by semicolons within the loop parentheses.'
            );
            return;
        }

        const init = parts[0].trim();
        if (init.startsWith('PADAM ')) {
            this.validateVariableDeclaration(init + ';');
        }

        const condition = parts[1].trim();
        this.validateCondition(condition);

        const update = parts[2].trim();
        if (!this.isAssignment(update)) {
            this.addError(
                'Loop update must be an assignment',
                'The update part of the loop should be an assignment statement, e.g., i = i + 1.'
            );
        }
    }

    isPrint(line) {
        return line.startsWith('CHATIMPU(');
    }

    validatePrint(line) {
        if (!line.endsWith(';')) {
            this.addError(
                'CHATIMPU statement must end with semicolon',
                'Add a semicolon ";" at the end of CHATIMPU statements.'
            );
            return;
        }

        const match = line.match(/CHATIMPU\((.+?)\);/);

        if (!match) {
            this.addError(
                'Invalid CHATIMPU syntax',
                'Use syntax: CHATIMPU(expression);'
            );
            return;
        }

        const arg = match[1].trim();

        if (arg.startsWith('"') && arg.endsWith('"')) {
            const output = arg.slice(1, -1);
            this.consoleOutput.push({
                type: 'output',
                value: output,
                line: this.currentLine
            });
        } else if (/^[a-zA-Z]\w*$/.test(arg)) {
            if (!this.variables.has(arg)) {
                this.addError(
                    `Variable '${arg}' used in CHATIMPU before declaration`,
                    `Declare variable '${arg}' before using it in CHATIMPU statements.`
                );
            } else {
                const val = this.variablesValues.get(arg);
                this.consoleOutput.push({
                    type: 'output',
                    value: val !== undefined ? val : `[${arg}]`,
                    line: this.currentLine
                });
            }
        } else {
            this.addError(
                `Invalid argument for CHATIMPU: ${arg}`,
                'Print statements accept either a string in quotes or a single variable name.'
            );
        }
    }

    isScan(line) {
        return line.startsWith('CHEPPU(');
    }

    validateScan(line) {
        if (!line.endsWith(';')) {
            this.addError(
                'CHEPPU statement must end with semicolon',
                'Add a semicolon ";" at the end of CHEPPU statements.'
            );
            return;
        }

        const match = line.match(/CHEPPU\((\w+)\);/);

        if (!match) {
            this.addError(
                'Invalid CHEPPU syntax',
                'Use syntax: CHEPPU(variableName);'
            );
            return;
        }

        const varName = match[1];

        if (!this.variables.has(varName)) {
            this.addError(
                `Variable '${varName}' used in CHEPPU before declaration`,
                `Declare variable '${varName}' before using it in CHEPPU.`
            );
        } else {
            this.consoleOutput.push({
                type: 'input',
                value: `Input required for ${varName}`,
                line: this.currentLine
            });
        }
    }

    addError(message, recommendation = '') {
        this.errors.push({
            line: this.currentLine,
            message,
            recommendation,
            type: 'error'
        });
    }

    addWarning(message) {
        this.warnings.push({
            line: this.currentLine,
            message,
            type: 'warning'
        });
    }
}