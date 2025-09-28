class YantraBhashiValidator {
  constructor() {
    this.variables = new Map();
    this.errors = [];
    this.reservedWords = [
      // Add your reserved words here if any
    ];
    this.DATA_TYPES = ['ANKHE', 'VARTTAI'];
  }

  preprocessCode(code) {
    return code
      .split('\n')
      .map(line => line.trim())
      .filter(line => line && !line.startsWith('#'))
      .map(line => line.replace(/^\d+\.\s*/, '')); // Strip line numbers like "1. "
  }

  validate(code) {
    this.variables.clear();
    this.errors = [];
    const lines = this.preprocessCode(code);

    for (let i = 0; i < lines.length; i++) {
      this.validateLine(lines[i], i + 1);
    }

    return {
      isValid: this.errors.length === 0,
      errors: this.errors,
    };
  }

  validateLine(line, lineNum) {
    if (line.startsWith('PADAM ')) {
      this.validateVariableDeclaration(line, lineNum);
    } else if (line.startsWith('CHATIMPU(')) {
      this.validatePrintStatement(line, lineNum);
    } else if (line.startsWith('CHEPPU(')) {
      this.validateInputStatement(line, lineNum);
    } else if (line.startsWith('ELAITHE ')) {
      this.validateConditional(line, lineNum);
    } else if (line.startsWith('MALLI-MALLI ')) {
      this.validateLoop(line, lineNum);
    } else if (line.includes(' = ') && !line.startsWith('PADAM ')) {
      this.validateAssignment(line, lineNum);
    } else if (line === ']' || line === '] ALAITHE [') {
      // Valid block markers - no error
    } else if (line.trim() !== '') {
      this.addError(lineNum, `Unknown statement: ${line}`);
    }
  }

  validateVariableDeclaration(line, lineNum) {
    const match = line.match(/^PADAM\s+([a-zA-Z][a-zA-Z0-9_]*):([A-Z]+)(?:\s*=\s*(.+))?;?$/);
    if (!match) {
      this.addError(lineNum, 'Invalid variable declaration syntax');
      return;
    }

    const [, varName, dataType, initialValue] = match;

    if (this.reservedWords.includes(varName)) {
      this.addError(lineNum, `Cannot use reserved word '${varName}' as variable name`);
      return;
    }

    if (!this.DATA_TYPES.includes(dataType)) {
      this.addError(lineNum, `Invalid data type '${dataType}'. Use ANKHE for integers or VARTTAI for strings`);
      return;
    }

    if (!line.endsWith(';')) {
      this.addError(lineNum, 'Variable declaration must end with semicolon');
    }

    this.variables.set(varName, { type: dataType, declared: true });

    if (typeof initialValue !== 'undefined') {
      let trimmedVal = initialValue.trim();
      if (trimmedVal.endsWith(';')) trimmedVal = trimmedVal.slice(0, -1).trim();

      if (dataType === 'ANKHE' && !/^-?\d+$/.test(trimmedVal)) {
        this.addError(lineNum, 'ANKHE variables can only be assigned integer values');
      }

      if (dataType === 'VARTTAI') {
        if (!(trimmedVal.startsWith('"') && trimmedVal.endsWith('"'))) {
          this.addError(lineNum, 'VARTTAI variables must be assigned string values in quotes');
        }
      }
    }
  }

  validatePrintStatement(line, lineNum) {
    if (!line.endsWith(';')) {
      this.addError(lineNum, 'CHATIMPU statement must end with semicolon');
    }

    const match = line.match(/^CHATIMPU\((.+)\);?$/);
    if (!match) {
      this.addError(lineNum, 'Invalid CHATIMPU syntax');
      return;
    }

    const param = match[1].trim();
    if (!(param.startsWith('"') && param.endsWith('"'))) {
      if (!this.variables.has(param)) {
        this.addError(lineNum, `Variable '${param}' used before declaration`);
      }
    }
  }

  validateInputStatement(line, lineNum) {
    if (!line.endsWith(';')) {
      this.addError(lineNum, 'CHEPPU statement must end with semicolon');
    }

    const match = line.match(/^CHEPPU\(([a-zA-Z][a-zA-Z0-9_]*)\);?$/);
    if (!match) {
      this.addError(lineNum, 'Invalid CHEPPU syntax');
      return;
    }

    const varName = match[1];
    if (!this.variables.has(varName)) {
      this.addError(lineNum, `Variable '${varName}' used before declaration`);
    }
  }

  validateConditional(line, lineNum) {
    const match = line.match(/^ELAITHE\s+\((.+)\)\s+\[$/);
    if (!match) {
      this.addError(lineNum, 'Invalid ELAITHE syntax. Should be: ELAITHE (condition) [');
      return;
    }

    const condition = match[1];
    this.validateCondition(condition, lineNum);
  }

  validateLoop(line, lineNum) {
    const match = line.match(/^MALLI-MALLI\s+\((.+)\)\s+\[$/);
    if (!match) {
      this.addError(lineNum, 'Invalid MALLI-MALLI syntax');
      return;
    }

    const loopCondition = match[1];
    const parts = loopCondition.split(';').map(p => p.trim());

    if (parts.length !== 3) {
      this.addError(lineNum, 'MALLI-MALLI must have three parts separated by semicolons');
      return;
    }

    if (!parts[0].startsWith('PADAM ')) {
      this.addError(lineNum, 'Loop initialization must declare a variable with PADAM');
    }
  }

  validateAssignment(line, lineNum) {
    if (!line.endsWith(';')) {
      this.addError(lineNum, 'Assignment statement must end with semicolon');
    }

    const match = line.match(/^([a-zA-Z][a-zA-Z0-9_]*)\s*=\s*(.+);?$/);
    if (!match) {
      this.addError(lineNum, 'Invalid assignment syntax');
      return;
    }

    const [, varName] = match;
    if (!this.variables.has(varName)) {
      this.addError(lineNum, `Variable '${varName}' used before declaration`);
    }
  }

  validateCondition(condition, lineNum) {
    const operators = ['==', '!=', '<=', '>=', '<', '>'];
    let foundOperator = false;

    for (const op of operators) {
      if (condition.includes(op)) {
        foundOperator = true;
        break;
      }
    }

    if (!foundOperator) {
      this.addError(lineNum, 'Condition must use valid comparison operators (==, !=, <, >, <=, >=)');
    }
  }

  addError(lineNum, message) {
    this.errors.push({ line: lineNum, message });
  }
}

export default YantraBhashiValidator;
