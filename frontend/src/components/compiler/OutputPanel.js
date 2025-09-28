import React from 'react';
import  '../../styles/components.css';  

const OutputPanel = ({ output }) => {
  return (
    <div className="w-1/2 p-4">
      <div className="bg-white rounded-lg shadow h-full flex flex-col">
        <div className="p-4 border-b">
          <h3 className="text-lg font-semibold text-gray-700">Output</h3>
        </div>
        <div className="flex-1 p-4">
          <pre className="font-mono text-sm whitespace-pre-wrap text-gray-800">
            {output || 'Run your code to see output...'}
          </pre>
        </div>
      </div>
    </div>
  );
};

export default OutputPanel;