import React, { useState, useEffect } from 'react';
import { api } from '../api';
export default function InstructorDashboard() {
    const [title, setTitle] = useState(''); const [desc, setDesc] = useState('');
    const [forums, setForums] = useState([]);
    const [selectedForum, setSelectedForum] = useState(null);
    const [submissions, setSubmissions] = useState([]);
    useEffect(() => { fetchForums(); }, []);
    async function fetchForums() {
        const f = await api.getForums(); setForums(f);
    }
    async function create() {
        await api.createForum({ title, description: desc });
        setTitle(''); setDesc('');
        fetchForums();
    }
    async function loadSubs() {
        if (!selectedForum) return;
        const s = await api.getSubmissions(selectedForum);
        setSubmissions(s);
    }
    async function giveFeedback(id) {
        const fb = prompt('Enter feedback');
        if (!fb) return;
        await api.giveFeedback(id, fb);
        loadSubs();
    }
    return (
        <div style={{ padding: 20 }}>
            <h2>Instructor Dashboard</h2>
            <h3>Create Forum</h3>
            <input placeholder="Title" value={title} onChange={e => setTitle(e.target.value)} /><br />
            <textarea placeholder="Description" value={desc} onChange={e => setDesc(e.target.value)} /><br />
            <button onClick={create}>Create</button>
            <h3>My Forums</h3>
            <select onChange={e => setSelectedForum(e.target.value)}>
                <option value="">--Select--</option>
                {forums.map(f => <option key={f._id} value={f._id}>{f.title}</option>)}
            </select>
            <button onClick={loadSubs}>Load Submissions</button>
            <h3>Submissions</h3>
            {submissions.map(s => (
                <div key={s._id} style={{ border: '1px solid #ccc', padding: 8, margin: 8 }}>
                    <strong>{s.studentId?.name} ({s.studentId?.rollNo})</strong>
                    <pre>{s.code}</pre>
                    <pre>{JSON.stringify(s.validationResult, null, 2)}</pre>
                    <div>Feedback: {s.feedback || ''}</div>
                    <button onClick={() => giveFeedback(s._id)}>Give Feedback</button>
                </div>
            ))}
        </div>
    )
}