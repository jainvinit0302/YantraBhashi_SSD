import React from 'react';
import { BarChart3, TrendingUp, Users, AlertCircle } from 'lucide-react';
import  '../../styles/components.css';  


const Analytics = ({ submissions }) => {
  const totalSubmissions = submissions.length;
  const successfulSubmissions = submissions.filter(s => s.status === 'success').length;
  const errorSubmissions = submissions.filter(s => s.status === 'error').length;
  const uniqueStudents = [...new Set(submissions.map(s => s.userId))].length;
  
  const successRate = totalSubmissions > 0 ? ((successfulSubmissions / totalSubmissions) * 100).toFixed(1) : 0;

  // Common errors analysis
  const errorMap = {};
  submissions
    .filter(s => s.status === 'error' && s.errors)
    .forEach(submission => {
      submission.errors.forEach(error => {
        const key = error.message;
        errorMap[key] = (errorMap[key] || 0) + 1;
      });
    });

  const commonErrors = Object.entries(errorMap)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-lg font-semibold text-gray-700 mb-1">Total Submissions</h4>
              <p className="text-3xl font-bold text-blue-600">{totalSubmissions}</p>
            </div>
            <BarChart3 size={32} className="text-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-lg font-semibold text-gray-700 mb-1">Successful</h4>
              <p className="text-3xl font-bold text-green-600">{successfulSubmissions}</p>
            </div>
            <TrendingUp size={32} className="text-green-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-lg font-semibold text-gray-700 mb-1">With Errors</h4>
              <p className="text-3xl font-bold text-red-600">{errorSubmissions}</p>
            </div>
            <AlertCircle size={32} className="text-red-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-lg font-semibold text-gray-700 mb-1">Active Students</h4>
              <p className="text-3xl font-bold text-purple-600">{uniqueStudents}</p>
            </div>
            <Users size={32} className="text-purple-500" />
          </div>
        </div>
      </div>

      {/* Additional Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Success Rate Card */}
        <div className="bg-white rounded-lg shadow p-6">
          <h4 className="text-lg font-semibold text-gray-700 mb-4">Success Rate</h4>
          <div className="flex items-center">
            <div className="flex-1">
              <div className="bg-gray-200 rounded-full h-4">
                <div 
                  className="bg-green-500 h-4 rounded-full transition-all duration-300"
                  style={{ width: `${successRate}%` }}
                ></div>
              </div>
            </div>
            <span className="ml-4 text-2xl font-bold text-gray-700">{successRate}%</span>
          </div>
        </div>

        {/* Common Errors */}
        <div className="bg-white rounded-lg shadow p-6">
          <h4 className="text-lg font-semibold text-gray-700 mb-4">Common Errors</h4>
          <div className="space-y-2">
            {commonErrors.length > 0 ? (
              commonErrors.map(([error, count], index) => (
                <div key={index} className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 truncate flex-1 pr-2">
                    {error}
                  </span>
                  <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs font-medium">
                    {count}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-sm">No errors recorded yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;