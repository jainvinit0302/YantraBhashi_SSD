import React from 'react';
import  '../../styles/components.css';  


const SubmissionDetails = ({ submission }) => {
  if (!submission) {
    return (
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b">
          <h3 className="text-lg font-semibold text-gray-700">Submission Details</h3>
        </div>
        <div className="p-4">
          <p className="text-gray-500">Select a submission to view details</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-4 border-b">
        <h3 className="text-lg font-semibold text-gray-700">Submission Details</h3>
      </div>
      
      <div className="p-4">
        {/* Header Information */}
        <div className="mb-4">
          <div className="grid grid-cols-1 gap-2">
            <p><strong>Student:</strong> {submission.userId}</p>
            <p>
              <strong>Status:</strong> 
              <span className={`ml-2 px-2 py-1 rounded text-sm font-medium ${
                submission.status === 'success' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {submission.status.toUpperCase()}
              </span>
            </p>
            <p><strong>Submitted:</strong> {new Date(submission.timestamp).toLocaleString()}</p>
          </div>
        </div>
        
        {/* Code Section */}
        <div className="mb-4">
          <h4 className="font-semibold mb-2 text-gray-700">Code:</h4>
          <pre className="bg-gray-100 p-3 rounded text-sm font-mono overflow-x-auto whitespace-pre-wrap border">
            {submission.code}
          </pre>
        </div>

        {/* Errors Section */}
        {submission.status === 'error' && submission.errors && submission.errors.length > 0 && (
          <div className="mb-4">
            <h4 className="font-semibold mb-2 text-red-700">Errors:</h4>
            <div className="bg-red-50 p-3 rounded border border-red-200">
              {submission.errors.map((error, idx) => (
                <div key={idx} className="text-red-700 text-sm mb-1">
                  <span className="font-medium">Line {error.line}:</span> {error.message}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Output Section */}
        {submission.output && (
          <div>
            <h4 className="font-semibold mb-2 text-gray-700">Output:</h4>
            <pre className="bg-gray-100 p-3 rounded text-sm font-mono whitespace-pre-wrap border">
              {submission.output}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};

export default SubmissionDetails;