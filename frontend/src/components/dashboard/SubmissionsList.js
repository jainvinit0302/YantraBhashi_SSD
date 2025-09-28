import React from 'react';
import { FileText, CheckCircle, XCircle, Eye } from 'lucide-react';
import  '../../styles/components.css';  


const SubmissionsList = ({ submissions, onSelectSubmission, selectedSubmission }) => {
  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-4 border-b">
        <h3 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
          <FileText size={20} />
          Submissions ({submissions.length})
        </h3>
      </div>
      
      <div className="max-h-96 overflow-y-auto">
        {submissions.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            No submissions found
          </div>
        ) : (
          submissions.map(submission => (
            <div
              key={submission.id}
              onClick={() => onSelectSubmission(submission)}
              className={`p-4 border-b hover:bg-gray-50 cursor-pointer transition duration-200 ${
                selectedSubmission?.id === submission.id ? 'bg-blue-50 border-blue-200' : ''
              }`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold text-gray-800">{submission.userId}</p>
                  <p className="text-sm text-gray-600">
                    {new Date(submission.timestamp).toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {submission.status === 'success' ? (
                    <CheckCircle size={20} className="text-green-500" />
                  ) : (
                    <XCircle size={20} className="text-red-500" />
                  )}
                  <Eye size={16} className="text-gray-400" />
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default SubmissionsList;