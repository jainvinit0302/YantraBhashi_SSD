const BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
async function request(path, opts = {}) {
    const token = localStorage.getItem('token');
    opts.headers = opts.headers || {};
    opts.headers['content-type'] = 'application/json';
    if (token) opts.headers['authorization'] = `Bearer ${token}`;
    const res = await fetch(BASE + path, opts);
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Request failed');
    return json;
}
export const api = {
    register: (payload) => request('/auth/register', { method: 'POST', body: JSON.stringify(payload) }),
    login: (payload) => request('/auth/login', { method: 'POST', body: JSON.stringify(payload) }),
    createForum: (payload) => request('/forums/create', { method: 'POST', body: JSON.stringify(payload) }),
    getForums: () => request('/forums/all'),
    submit: (forumId, code) => request(`/submissions/${forumId}/submit`, {
        method: 'POST', body: JSON.stringify({
            code
        })
    }),
    getSubmissions: (forumId) => request(`/submissions/${forumId}`),
    giveFeedback:
        (id,
            feedback)
            =>
            request(`/submissions/feedback/${id}`,
                {
                    method:
                        'POST',
                    JSON.stringify({ feedback })
                }),
    validate: (code) => request('/yantra/validate', { method: 'POST', body: JSON.stringify({ code }) }),
    run: (code) => request('/yantra/run', { method: 'POST', body: JSON.stringify({ code }) }),
}