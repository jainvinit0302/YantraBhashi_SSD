import React, { useState } from 'react';
import Header from '../common/Header';
import CodeEditor from './CodeEditor';
import OutputPanel from './OutputPanel';
import YantraBhashiValidator from '../../services/validator';
import mockAPI from '../../services/mockAPI';
import  '../../styles/components.css';  


const CompilerInterface = ({ user, onLogout }) => {
  const [code, setCode] = useState(`PADAM message:VARTTAI = "Hello World";
CHATIMPU(message);`);
  const [output, setOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);

  const runCode = async () => {
  setIsRunning(true);
  const validator = new YantraBhashiValidator();
  const result = validator.validate(code);

  let outputText = '';
  let status = 'success';
  let errors = [];

  if (!result.isValid) {
    status = 'error';
    errors = result.errors;
    outputText = 'Compilation Errors:\n' + result.errors.map(err => `Line ${err.line}: ${err.message}`).join('\n');
  } else {
    outputText = 'Code compiled successfully!\nOutput:\nHello World';
  }

  setOutput(outputText);

  try {
    // Call backend submit API
    await fetch('http://localhost:4000/submit', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userId: user.userId, // or user.userId, make sure this is not undefined!
    code,
    status,
    output: status === 'success' ? outputText : '',
    errors,
  }),
});
  } catch (error) {
    console.error('Error submitting code:', error);
  }

  setIsRunning(false);
};


  return (
    <div className="min-h-screen bg-gray-100">
      <Header 
        title="YantraBhashi Compiler" 
        user={user} 
        onLogout={onLogout} 
      />
      
      <div className="flex h-screen">
        <CodeEditor 
          code={code}
          setCode={setCode}
          onRun={runCode}
          isRunning={isRunning}
        />
        <OutputPanel output={output} />
      </div>
    </div>
  );
};

export default CompilerInterface;