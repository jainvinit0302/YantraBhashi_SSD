import React, { useState, useEffect } from 'react'; import { useParams } from 'react-router-dom';
import { api } from '../api';
export default function ForumPage() {
    const { id } = useParams();
    const [forum, setForum] = useState(null);
    useEffect(() => {
        api.getForums().then(list => setForum(list.find(f => f._id === id))).catch(() => { });
    }, [id]);
    return (
        <div style={{ padding: 20 }}>
            <h2>{forum?.title}</h2>
            <p>{forum?.description}</p>
            <a href="/student">Go to Student Dashboard</a>
        </div>
    )
}