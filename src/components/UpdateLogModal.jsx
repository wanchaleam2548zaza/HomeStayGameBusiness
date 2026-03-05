import React from 'react';

const UpdateLogModal = ({ show, onClose }) => {
    if (!show) return null;

    const updates = [
        {
            version: "v1.2.0: Anti-Pump & Starter Titles",
            date: "5 มี.ค. 2026",
            changes: [
                "🛡️ [Anti-Pump] เพิ่มระบบป้องกันการปั่นหุ้น (ห้ามซื้อหุ้นตัวเอง, จำกัดการถือครอง)",
                "📈 [Stock Market] ล็อคราคาหุ้นสูงสุดไม่เกิน 3 เท่าของราคา IPO",
                "💰 [Capital Gains] เพิ่มภาษีจากการขายหุ้นทำกำไรที่ 15%",
                "🏥 [Bankruptcy] ล้างพอร์ตโฟลิโอและถอดหุ้นออกจากตลาดเมื่อยื่นล้มละลาย",
                "🎖️ [Titles] เพิ่มฉายาระดับ STARTER 10 แบบ ราคาเริ่ม 10K - 90K",
                "✨ [Titles] ฉายามีผลกับรายได้, วงเงินกู้ และ Hype อย่างเป็นทางการ",
                "🏦 [Auction] แก้บั๊กการประมูล (ฉายาไม่เข้า, ไม่หักเงิน, หน้าต่างปิดไม่ลง)",
                "📊 [UI/UX] แก้ปัญหากราฟรายได้หดตัวบนมือถือ"
            ]
        },
        {
            version: "v1.1.0: Bank & Device Login",
            date: "4 มี.ค. 2026",
            changes: [
                "📱 [Login] เปลี่ยนการจำกัดผู้เล่นจาก IP เป็น Device ID ทำให้เล่นวงแลนเดียวกันได้",
                "💸 [Bank] เพิ่มระบบธนาคารแบบ Premium UI (กู้เงิน/ชำระหนี้)",
                "🏆 [Leaderboard] นำข้อมูลระบบออก และโชว์เฉพาะผู้เล่นจริง"
            ]
        }
    ];

    return (
        <div className="glass-overlay" onClick={onClose} style={{ zIndex: 9999 }}>
            <div className="modal-content update-log-modal" onClick={e => e.stopPropagation()} style={{
                background: 'rgba(10, 15, 30, 0.95)',
                border: '1px solid rgba(0, 225, 255, 0.3)',
                padding: '25px',
                borderRadius: '24px',
                maxWidth: '500px',
                width: '90%',
                maxHeight: '80vh',
                overflowY: 'auto',
                boxShadow: '0 10px 40px rgba(0, 0, 0, 0.5)'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px' }}>
                    <h2 style={{ margin: 0, color: '#00E1FF', fontSize: '1.4rem' }}>📋 แพทช์โน้ต (Update Log)</h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '24px', cursor: 'pointer' }}>&times;</button>
                </div>

                <div className="update-list" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {updates.map((update, idx) => (
                        <div key={idx} className="update-item" style={{
                            background: 'rgba(255,255,255,0.03)',
                            padding: '15px',
                            borderRadius: '12px',
                            border: '1px solid rgba(255,255,255,0.05)'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '10px' }}>
                                <h3 style={{ margin: 0, color: '#00ff88', fontSize: '1.1rem' }}>{update.version}</h3>
                                <span style={{ fontSize: '0.75rem', color: '#aaa' }}>{update.date}</span>
                            </div>
                            <ul style={{ margin: 0, paddingLeft: '20px', color: 'rgba(255,255,255,0.8)', fontSize: '0.85rem', lineHeight: '1.5' }}>
                                {update.changes.map((change, i) => (
                                    <li key={i} style={{ marginBottom: '5px' }}>{change}</li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                <button className="primary-btn" onClick={onClose} style={{ marginTop: '20px' }}>
                    รับทราบ
                </button>
            </div>
        </div>
    );
};

export default UpdateLogModal;
