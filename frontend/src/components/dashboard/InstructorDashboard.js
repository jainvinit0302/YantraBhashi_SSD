import React, { useState, useEffect } from 'react';
import Header from '../common/Header';
import SubmissionsList from './SubmissionsList';
import SubmissionDetails from './SubmissionDetails';
import Analytics from './Analytics';
import mockAPI from '../../services/mockAPI';
import  '../../styles/components.css';  


const InstructorDashboard = ({ user, onLogout }) => {
  const [submissions, setSubmissions] = useState([]);
  const [selectedUser, setSelectedUser] = useState('');
  const [filteredSubmissions, setFilteredSubmissions] = useState([]);
  const [selectedSubmission, setSelectedSubmission] = useState(null);

  useEffect(() => {
    loadSubmissions();
  }, []);

  useEffect(() => {
    if (selectedUser) {
      setFilteredSubmissions(submissions.filter(s => s.userId === selectedUser));
    } else {
      setFilteredSubmissions(submissions);
    }
  }, [selectedUser, submissions]);

  const loadSubmissions = async () => {
    const data = await mockAPI.getSubmissions();
    setSubmissions(data);
  };

  const uniqueUsers = [...new Set(submissions.map(s => s.userId))];

  return (
    <div className="min-h-screen bg-gray-100">
      <Header 
        title="Instructor Dashboard" 
        user={user} 
        onLogout={onLogout} 
      />

      <div className="p-6">
        {/* Filter Section */}
        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Filter by Student:
          </label>
          <select
            value={selectedUser}
            onChange={(e) => setSelectedUser(e.target.value)}
            className="px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
          >
            <option value="">All Students</option>
            {uniqueUsers.map(userId => (
              <option key={userId} value={userId}>{userId}</option>
            ))}
          </select>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <SubmissionsList 
            submissions={filteredSubmissions}
            onSelectSubmission={setSelectedSubmission}
            selectedSubmission={selectedSubmission}
          />
          
          <SubmissionDetails 
            submission={selectedSubmission}
          />
        </div>

        {/* Analytics Section */}
        <Analytics submissions={submissions} />
      </div>
    </div>
  );
};

export default InstructorDashboard;