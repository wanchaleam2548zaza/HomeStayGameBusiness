import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { ref, onValue, update, remove, get } from "firebase/database";

const AdminDashboard = ({ username, onLogout }) => {
    const [users, setUsers] = useState({});
    const [logs, setLogs] = useState([]);
    const [selectedUser, setSelectedUser] = useState('');
    const [addMoneyAmount, setAddMoneyAmount] = useState(1000000);

    // ป้องกันการเข้าถึงจากผู้ใช้ทั่วไปซ้ำอีกชั้น
    if (username !== 'homestaywann') {
        return <div style={{ color: 'red', textAlign: 'center', padding: '50px' }}>❌ ACCESS DENIED</div>;
    }

    useEffect(() => {
        const usersRef = ref(db, 'users');
        const unsubscribe = onValue(usersRef, (snapshot) => {
            if (snapshot.exists()) {
                setUsers(snapshot.val());
            } else {
                setUsers({});
            }
        });
        return () => unsubscribe();
    }, []);

    const addLog = (msg) => {
        setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev].slice(0, 20));
    };

    const handleAddMoney = async () => {
        if (!selectedUser) return alert("เลือกผู้เล่นก่อนครับแอดมิน");
        const userRef = ref(db, `users/${selectedUser}`);

        try {
            const snap = await get(userRef);
            if (snap.exists()) {
                const data = snap.val();
                const newMoney = (data.money || 0) + Number(addMoneyAmount);
                await update(userRef, { money: newMoney });
                addLog(`เสกเงินให้ ${selectedUser} จำนวน ${Number(addMoneyAmount).toLocaleString()} บาท (รวมเป็น ${newMoney.toLocaleString()})`);
                alert(`✅ เสกเงินสำเร็จ!`);
            }
        } catch (err) {
            console.error(err);
            alert("เกิดข้อผิดพลาด");
        }
    };

    const handleResetAllData = async () => {
        if (!window.confirm("⚠️ ยืนยันการ LIPE ถล่มเซิร์ฟเวอร์? (ลบข้อมูลผู้เล่น, หุ้นตลากโลก, และการประมูลออกทั้งหมด)")) return;
        if (prompt("พิมพ์คำว่า CONFIRM เพื่อยืนยันการล้างข้อมูล") !== 'CONFIRM') {
            return alert("ยกเลิกการล้างข้อมูล");
        }

        try {
            // ล้างข้อมูลหลัก
            await remove(ref(db, 'users'));
            await remove(ref(db, 'global_stocks'));
            await remove(ref(db, 'global_auction'));
            addLog("🔴 [SYSTEM ALERT] ข้อมูลทั้งหมดถูกรีเซ็ตแล้ว!");
            alert("✅ รีเซ็ตข้อมูลเซิร์ฟเวอร์เสร็จสมบูรณ์");
        } catch (error) {
            console.error("Reset Error:", error);
            alert("เกิดข้อผิดพลาดในการล้างข้อมูล");
        }
    };

    const handleDeleteUser = async (userKey) => {
        if (!window.confirm(`ลบผู้เล่น ${userKey} ยืนยัน?`)) return;
        try {
            await remove(ref(db, `users/${userKey}`));
            await remove(ref(db, `global_stocks/${userKey}`));
            addLog(`🗑️ ลบผู้เล่น ${userKey} ออกจากระบบ`);
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            width: '100vw',
            background: '#0d1117',
            color: '#c9d1d9',
            padding: '20px',
            fontFamily: 'monospace',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
            overflowY: 'auto'
        }}>
            <header style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '1px solid #30363d',
                paddingBottom: '15px'
            }}>
                <h1 style={{ color: '#58a6ff', margin: 0 }}>🛡️ Super Admin Terminal</h1>
                <button onClick={onLogout} style={{
                    background: '#da3633', color: 'white', border: 'none',
                    padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold'
                }}>EXIT DASHBOARD</button>
            </header>

            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                {/* Panel ควบคุมหลัก */}
                <div style={{
                    flex: '1 1 300px',
                    background: '#161b22',
                    border: '1px solid #30363d',
                    borderRadius: '8px',
                    padding: '20px'
                }}>
                    <h2 style={{ borderBottom: '1px solid #30363d', paddingBottom: '10px', marginTop: 0 }}>⚡ โกงระบบ / เครื่องมือพระเจ้า</h2>

                    <div style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', marginBottom: '5px' }}>ผู้เล่นเป้าหมาย (Username):</label>
                        <select
                            value={selectedUser}
                            onChange={(e) => setSelectedUser(e.target.value)}
                            style={{ width: '100%', padding: '8px', background: '#010409', color: '#fff', border: '1px solid #30363d', borderRadius: '6px' }}
                        >
                            <option value="">-- เลือกผู้เล่น --</option>
                            {Object.keys(users).map(k => (
                                <option key={k} value={k}>{k} ({users[k].displayName || 'No Name'})</option>
                            ))}
                        </select>
                    </div>

                    <div style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
                        <input
                            type="number"
                            value={addMoneyAmount}
                            onChange={(e) => setAddMoneyAmount(e.target.value)}
                            style={{ flex: 1, padding: '8px', background: '#010409', color: '#fff', border: '1px solid #30363d', borderRadius: '6px' }}
                        />
                        <button onClick={handleAddMoney} style={{
                            background: '#2ea043', color: 'white', border: 'none',
                            padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold'
                        }}>เสกเงิน (+)</button>
                    </div>

                    <div style={{ marginTop: '40px', paddingTop: '20px', borderTop: '1px dashed #da3633' }}>
                        <h3 style={{ color: '#da3633', marginTop: 0 }}>☢️ DANGER ZONE</h3>
                        <button onClick={handleResetAllData} style={{
                            width: '100%', background: 'transparent', color: '#da3633', border: '2px solid #da3633',
                            padding: '12px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold'
                        }}>WIPE ALL DATA (รีเซ็ตเซิร์ฟเวอร์)</button>
                    </div>
                </div>

                {/* รายชื่อผู้เล่น */}
                <div style={{
                    flex: '2 1 600px',
                    background: '#161b22',
                    border: '1px solid #30363d',
                    borderRadius: '8px',
                    padding: '20px'
                }}>
                    <h2 style={{ borderBottom: '1px solid #30363d', paddingBottom: '10px', marginTop: 0 }}>👥 ข้อมูลผู้เล่นทั้งหมด ({Object.keys(users).length})</h2>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid #30363d' }}>
                                    <th style={{ padding: '8px' }}>Username</th>
                                    <th style={{ padding: '8px' }}>ชื่อแสดงผล</th>
                                    <th style={{ padding: '8px' }}>เงิน (บาท)</th>
                                    <th style={{ padding: '8px' }}>หนี้</th>
                                    <th style={{ padding: '8px' }}>ขนาดธุรกิจ</th>
                                    <th style={{ padding: '8px' }}>สถานะ IPO</th>
                                    <th style={{ padding: '8px' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {Object.entries(users).map(([key, data]) => (
                                    <tr key={key} style={{ borderBottom: '1px solid #30363d' }}>
                                        <td style={{ padding: '8px', color: '#58a6ff' }}>{key}</td>
                                        <td style={{ padding: '8px' }}>{data.displayName || '-'}</td>
                                        <td style={{ padding: '8px', color: data.money < 0 ? '#da3633' : '#3fb950' }}>฿{Number(data.money || 0).toLocaleString()}</td>
                                        <td style={{ padding: '8px', color: data.debt > 0 ? '#da3633' : '#8b949e' }}>฿{Number(data.debt || 0).toLocaleString()}</td>
                                        <td style={{ padding: '8px' }}>{data.fleetSize || 1}</td>
                                        <td style={{ padding: '8px' }}>{data.isIPO ? '✅' : '❌'}</td>
                                        <td style={{ padding: '8px' }}>
                                            <button onClick={() => handleDeleteUser(key)} style={{
                                                background: '#da3633', color: 'white', border: 'none',
                                                padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.7rem'
                                            }}>ลบ</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Admin Logs */}
            <div style={{
                background: '#010409',
                border: '1px solid #30363d',
                borderRadius: '8px',
                padding: '10px 20px',
                height: '150px',
                overflowY: 'auto'
            }}>
                <h3 style={{ color: '#8b949e', marginTop: 0, fontSize: '0.9rem' }}>SYSTEM LOGS</h3>
                <ul style={{ listStyleType: 'none', padding: 0, margin: 0, fontSize: '0.85rem', color: '#8b949e' }}>
                    {logs.map((log, i) => <li key={i} style={{ marginBottom: '4px' }}>{log}</li>)}
                    {logs.length === 0 && <li>ไม่มีเหตุการณ์...</li>}
                </ul>
            </div>
        </div>
    );
};

export default AdminDashboard;
