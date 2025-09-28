import React from 'react';
import { Play } from 'lucide-react';
import '../../styles/components.css';

const CodeEditor = ({ code, setCode, onRun, isRunning }) => {
  return (
    <div className="code-editor-container">
      <div className="code-editor-card">
        <div className="code-editor-header">
          <h3 className="code-editor-title">Code Editor</h3>
          <button
            onClick={onRun}
            disabled={isRunning}
            className="run-btn"
          >
            <Play size={16} />
            {isRunning ? 'Running...' : 'Run'}
          </button>
        </div>
        <textarea
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="code-editor-textarea"
          placeholder="Write your YantraBhashi code here..."
        />
      </div>
    </div>
  );
};

export default CodeEditor;
