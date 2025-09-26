import React from 'react'; export default function CodeEditor({ value, onChange }) {
    return (
        <textarea value={value} onChange={e => onChange(e.target.value)} rows={12} cols={80} style={{
            fontFamily:
                'monospace'
        }} />
    )
}