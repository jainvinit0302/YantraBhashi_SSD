import React, { useState, useEffect } from 'react';
import { api } from '../api';
import CodeEditor from '../components/CodeEditor';
export default function StudentDashboard() {
    const [forums, setForums] = useState([]);
    const [selected, setSelected] = useState(null);
    const [code, setCode] = useState('PADAM a:ANKHE = 0;\\nCHATIMPU(a);');
    const [result, setResult] = useState(null);
    useEffect(() => { api.getForums().then(setForums).catch(() => { }); }, []);
    async function submit() {
        try {
            const res = await api.submit(selected, code);
            alert('Submitted');
        } catch (e) { alert(e.message); }
    }
    async function run() {
        try {
            const res = await api.run(code);
            setResult(res);
        } catch (e) { alert(e.message); }
    }
    return (
        <div style={{ padding: 20 }}>
            <h2>Student Dashboard</h2>
            <div>
                <label>Choose Forum:</label>
                <select onChange={e => setSelected(e.target.value)}>
                    <option value="">--select--</option>
                    {forums.map(f => <option key={f._id} value={f._id}>{f.title}</option>)}
                </select>
            </div>
            <CodeEditor value={code} onChange={setCode} />
            <br />
            <button onClick={run}>Validate & Run</button>
            <button onClick={submit} disabled={!selected}>Submit to Forum</button>
            <pre>{result ? JSON.stringify(result, null, 2) : 'No run yet'}</pre>
        </div>
    )
}