import React, { useState, useEffect } from 'react';
import { TITLES } from '../config/auctionData';

const Leaderboard = ({ show, onClose, competitors, username, businessTypes, refreshInterval = 15 }) => {
  const [countdown, setCountdown] = useState(refreshInterval);

  // Countdown timer ที่นับลงแล้ว reset ทุก refreshInterval วินาที
  useEffect(() => {
    if (!show) return;
    setCountdown(refreshInterval);
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) return refreshInterval;
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [show, refreshInterval]);

  if (!show) return null;

  const pct = ((refreshInterval - countdown) / refreshInterval) * 100;

  return (
    <div
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)',
        display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999
      }}
      onClick={onClose}
    >
      <div
        className="glass-window"
        onClick={e => e.stopPropagation()}
        style={{
          background: 'rgba(20, 25, 40, 0.95)', border: '1px solid rgba(255, 255, 255, 0.15)',
          borderRadius: '20px', width: '90%', maxWidth: '400px', maxHeight: '75vh',
          display: 'flex', flexDirection: 'column', boxShadow: '0 10px 40px rgba(0,0,0,0.5)'
        }}
      >
        {/* Header */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <span style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>🏆 กระดานผู้นำธุรกิจ</span>
            <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '1.2rem', cursor: 'pointer' }}>✖</button>
          </div>

          {/* Refresh countdown bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', whiteSpace: 'nowrap' }}>
              🔄 refresh ใน {countdown}s
            </span>
            <div style={{ flex: 1, height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${pct}%`,
                background: countdown <= 3 ? '#00ff88' : 'rgba(255,255,255,0.3)',
                borderRadius: '2px',
                transition: 'width 1s linear, background 0.3s'
              }} />
            </div>
          </div>
        </div>

        {/* Content */}
        <div style={{ overflowY: 'auto', padding: '10px', flex: 1 }}>
          {competitors.map((comp, idx) => {
            const isMe = comp.username === username;
            const bIcon = businessTypes[comp.businessType]?.icon || '🏢';
            const rankColor = idx === 0 ? '#FFD700' : idx === 1 ? '#C0C0C0' : idx === 2 ? '#CD7F32' : '#888';
            const rankEmoji = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : null;

            return (
              <div key={comp.username} style={{
                display: 'flex', justifyContent: 'space-between', padding: '12px 10px',
                borderBottom: '1px solid rgba(255,255,255,0.05)',
                background: isMe ? 'rgba(0, 255, 136, 0.08)' : 'transparent',
                borderRadius: isMe ? '8px' : '0',
                transition: 'background 0.2s'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <strong style={{ width: '28px', color: rankColor, fontSize: '1rem', textAlign: 'center' }}>
                    {rankEmoji || `#${idx + 1}`}
                  </strong>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '0.9rem' }}>
                      {bIcon} {comp.displayName}
                      {isMe && <span style={{ color: '#00ff88', fontSize: '0.72rem', marginLeft: '5px' }}>(คุณ)</span>}
                    </span>
                    {comp.activeTitle && TITLES[comp.activeTitle] && (
                      <span style={{
                        fontSize: '0.6rem', width: 'fit-content', marginTop: '2px',
                        padding: '2px 5px', borderRadius: '4px',
                        background: TITLES[comp.activeTitle].color, color: '#fff'
                      }}>
                        {TITLES[comp.activeTitle].name}
                      </span>
                    )}
                  </div>
                </div>
                <strong className={comp.money < 0 ? "danger" : "success"} style={{ fontSize: '0.9rem', alignSelf: 'center' }}>
                  ฿{comp.money.toLocaleString()}
                </strong>
              </div>
            );
          })}
          {competitors.length === 0 && (
            <p style={{ textAlign: 'center', color: '#888', marginTop: '20px' }}>กำลังโหลดข้อมูลคู่แข่ง...</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;