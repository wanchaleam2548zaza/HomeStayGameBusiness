import React from 'react';
import { TITLES } from '../config/auctionData';

const Leaderboard = ({ show, onClose, competitors, username, businessTypes }) => {
  // ถ้า show เป็น false ให้ซ่อน Component นี้ไปเลย
  if (!show) return null;

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
        {/* Header ของ Modal */}
        <div style={{ padding: '20px', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>🏆 กระดานผู้นำธุรกิจ</span>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '1.2rem', cursor: 'pointer' }}>✖</button>
        </div>

        {/* Content ด้านใน (เลื่อน Scroll ได้) */}
        <div style={{ overflowY: 'auto', padding: '10px', flex: 1 }}>
          {competitors.map((comp, idx) => {
            const isMe = comp.username === username;
            const bIcon = businessTypes[comp.businessType]?.icon || '🏢';

            // สีเหรียญทอง เงิน ทองแดง
            const rankColor = idx === 0 ? '#FFD700' : idx === 1 ? '#C0C0C0' : idx === 2 ? '#CD7F32' : '#888';

            return (
              <div key={comp.username} style={{
                display: 'flex', justifyContent: 'space-between', padding: '15px 10px',
                borderBottom: '1px solid rgba(255,255,255,0.05)',
                background: isMe ? 'rgba(0, 255, 136, 0.1)' : 'transparent',
                borderRadius: isMe ? '8px' : '0'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <strong style={{ width: '25px', color: rankColor, fontSize: '1.1rem' }}>
                    #{idx + 1}
                  </strong>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '0.9rem' }}>
                      {bIcon} {comp.displayName || "Anonymous Player"}
                      {isMe && <span style={{ color: '#00ff88', fontSize: '0.75rem', marginLeft: '5px' }}>(คุณ)</span>}
                    </span>
                    {/* 🔴 แสดงฉายาถ้ามี */}
                    {comp.activeTitle && TITLES[comp.activeTitle] && (
                      <span style={{
                        fontSize: '0.6rem',
                        width: 'fit-content',
                        marginTop: '2px',
                        padding: '2px 5px',
                        borderRadius: '4px',
                        background: TITLES[comp.activeTitle].color,
                        color: '#fff'
                      }}>
                        {TITLES[comp.activeTitle].name}
                      </span>
                    )}
                  </div>
                </div>
                <strong className={comp.money < 0 ? "danger" : "success"} style={{ fontSize: '0.9rem' }}>
                  ฿{comp.money.toLocaleString()}
                </strong>
              </div>
            );
          })}
          {competitors.length === 0 && <p style={{ textAlign: 'center', color: '#888', marginTop: '20px' }}>กำลังโหลดข้อมูลคู่แข่ง...</p>}
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;