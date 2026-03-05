import React from 'react';

const InfoModal = ({ show, onClose, title, content }) => {
    if (!show) return null;

    return (
        <div className="glass-overlay" onClick={onClose} style={{ zIndex: 10000 }}>
            <div
                className="glass-panel"
                onClick={e => e.stopPropagation()}
                style={{ padding: '20px', maxWidth: '300px', width: '85%', textAlign: 'center', position: 'relative' }}
            >
                <button onClick={onClose} style={{ position: 'absolute', top: '10px', right: '10px', background: 'none', border: 'none', color: '#fff', fontSize: '1.2rem', cursor: 'pointer' }}>×</button>
                <h3 style={{ color: '#00ff88', marginBottom: '15px' }}>{title}</h3>
                <div style={{ fontSize: '0.9rem', lineHeight: '1.5', color: '#ccc', maxHeight: '60vh', overflowY: 'auto', textAlign: 'left', paddingRight: '5px', whiteSpace: 'pre-line' }}>{content}</div>
                <button className="primary-btn" onClick={onClose} style={{ marginTop: '20px', width: '100%' }}>เข้าใจแล้ว</button>
            </div>
        </div>
    );
};

export default InfoModal;