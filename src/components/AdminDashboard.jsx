import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { ref, onValue, update, remove, get } from "firebase/database";

const AdminDashboard = ({ username, onLogout }) => {
    const [users, setUsers] = useState({});
    const [globalStocks, setGlobalStocks] = useState({});
    const [auctionData, setAuctionData] = useState(null);
    const [logs, setLogs] = useState([]);
    const [selectedUser, setSelectedUser] = useState('');
    const [addMoneyAmount, setAddMoneyAmount] = useState(1000000);
    const [adminMessage, setAdminMessage] = useState('');
    const [lastUpdated, setLastUpdated] = useState(new Date());

    if (username !== 'homestaywann') {
        return <div style={{ color: 'red', textAlign: 'center', padding: '50px' }}>❌ ACCESS DENIED</div>;
    }

    // 🔴 Real-time: ข้อมูลผู้เล่นทั้งหมด
    useEffect(() => {
        const unsubscribe = onValue(ref(db, 'users'), (snap) => {
            setUsers(snap.exists() ? snap.val() : {});
            setLastUpdated(new Date());
        });
        return () => unsubscribe();
    }, []);

    // 📈 Real-time: ข้อมูลตลาดหุ้น
    useEffect(() => {
        const unsubscribe = onValue(ref(db, 'global_stocks'), (snap) => {
            setGlobalStocks(snap.exists() ? snap.val() : {});
            setLastUpdated(new Date());
        });
        return () => unsubscribe();
    }, []);

    // 🔨 Real-time: ข้อมูลการประมูลปัจจุบัน
    useEffect(() => {
        const unsubscribe = onValue(ref(db, 'global_auction'), (snap) => {
            setAuctionData(snap.exists() ? snap.val() : null);
            setLastUpdated(new Date());
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
                await update(userRef, {
                    adminGift: Number(addMoneyAmount),
                    adminMessage: adminMessage.trim() || null
                });
                addLog(`🎁 ส่งเงินให้ ${selectedUser}: +฿${Number(addMoneyAmount).toLocaleString()} ${adminMessage ? `("${adminMessage}")` : ''}`);
                alert(`✅ ส่งเงินสำเร็จ!`);
                setAdminMessage('');
            } else {
                alert("ไม่พบผู้เล่นนี้ในระบบ");
            }
        } catch (err) {
            console.error(err);
            alert("เกิดข้อผิดพลาด");
        }
    };

    const handleForceRefresh = async () => {
        if (!window.confirm("🔄 ยืนยันการ Refresh ทุก Client?")) return;
        try {
            await update(ref(db, 'global_reload'), { timestamp: Date.now(), by: 'admin' });
            addLog('🔄 Force Refresh ส่งสู่ทุก Client แล้ว!');
            alert('✅ ส่ง Refresh สำเร็จ!');
        } catch (err) {
            console.error(err);
            alert('เกิดข้อผิดพลาด');
        }
    };

    const handleResetAllData = async () => {
        if (!window.confirm("⚠️ ยืนยันการ WIPE ข้อมูลทั้งหมด?")) return;
        if (prompt("พิมพ์คำว่า CONFIRM เพื่อยืนยัน") !== 'CONFIRM') return alert("ยกเลิก");
        try {
            await remove(ref(db, 'users'));
            await remove(ref(db, 'global_stocks'));
            await remove(ref(db, 'global_auction'));
            await update(ref(db, '/'), {
                users: { _placeholder: true },
                global_stocks: { _placeholder: true }
            });
            await remove(ref(db, 'users/_placeholder'));
            await remove(ref(db, 'global_stocks/_placeholder'));
            addLog("🔴 [SYSTEM] รีเซ็ตข้อมูลทั้งหมดแล้ว!");
            alert("✅ รีเซ็ตสำเร็จ");
        } catch (error) {
            console.error(error);
            alert("เกิดข้อผิดพลาด");
        }
    };

    const handleDeleteUser = async (userKey) => {
        if (!window.confirm(`ลบผู้เล่น "${users[userKey]?.displayName || userKey}" ยืนยัน?`)) return;
        try {
            await update(ref(db, '/'), {
                [`users/${userKey}`]: null,
                [`global_stocks/${userKey}`]: null
            });
            addLog(`🗑️ ลบผู้เล่น ${userKey} ออกจากระบบ`);
        } catch (err) {
            console.error(err);
        }
    };

    // Stats คำนวณ
    const playerList = Object.entries(users).filter(([, d]) => d?.displayName);
    const totalMoney = playerList.reduce((s, [, d]) => s + (Number(d.money) || 0), 0);
    const totalDebt = playerList.reduce((s, [, d]) => s + (Number(d.debt) || 0), 0);
    const ipoCount = playerList.filter(([, d]) => d.isIPO).length;
    const playerStocks = Object.values(globalStocks).filter(s => s?.isPlayer);

    const box = { background: '#161b22', border: '1px solid #30363d', borderRadius: '8px', padding: '15px', textAlign: 'center' };
    const th = { padding: '8px 12px', textAlign: 'left', color: '#8b949e', fontWeight: 'normal', fontSize: '0.8rem', borderBottom: '1px solid #21262d', whiteSpace: 'nowrap' };
    const td = { padding: '8px 12px', borderBottom: '1px solid #21262d', fontSize: '0.85rem' };

    return (
        <div style={{ minHeight: '100vh', width: '100vw', background: '#0d1117', color: '#c9d1d9', padding: '20px', fontFamily: 'monospace', display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto', boxSizing: 'border-box' }}>

            {/* Header */}
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #30363d', paddingBottom: '15px' }}>
                <div>
                    <h1 style={{ color: '#58a6ff', margin: 0 }}>🛡️ Super Admin Terminal</h1>
                    <span style={{ fontSize: '0.75rem', color: '#666' }}>🟢 LIVE — อัปเดตล่าสุด: {lastUpdated.toLocaleTimeString('th-TH')}</span>
                </div>
                <button onClick={onLogout} style={{ background: '#da3633', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>EXIT</button>
            </header>

            {/* Stats Bar */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px' }}>
                <div style={box}><div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#58a6ff' }}>{playerList.length}</div><div style={{ fontSize: '0.75rem', color: '#8b949e' }}>ผู้เล่นทั้งหมด</div></div>
                <div style={box}><div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#3fb950' }}>฿{totalMoney.toLocaleString()}</div><div style={{ fontSize: '0.75rem', color: '#8b949e' }}>เงินรวมทุกคน</div></div>
                <div style={box}><div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#da3633' }}>฿{totalDebt.toLocaleString()}</div><div style={{ fontSize: '0.75rem', color: '#8b949e' }}>หนี้รวมทุกคน</div></div>
                <div style={box}><div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#FFD700' }}>{ipoCount}</div><div style={{ fontSize: '0.75rem', color: '#8b949e' }}>บริษัท IPO แล้ว</div></div>
                <div style={box}><div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#bc8cff' }}>{playerStocks.length}</div><div style={{ fontSize: '0.75rem', color: '#8b949e' }}>หุ้นในตลาด</div></div>
                <div style={{ ...box, borderColor: auctionData?.bidder && auctionData.bidder !== 'ไม่มี' ? '#ff7b72' : '#30363d' }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#ff7b72' }}>{auctionData?.bidder && auctionData.bidder !== 'ไม่มี' ? '🔥 กำลังประมูล' : '⏸️ รอรอบ'}</div>
                    <div style={{ fontSize: '0.7rem', color: '#8b949e' }}>{auctionData?.price ? `฿${Number(auctionData.price).toLocaleString()}` : 'ยังไม่มีราคา'}</div>
                </div>
            </div>

            {/* Auction Panel */}
            {auctionData && (
                <div style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: '8px', padding: '15px' }}>
                    <h3 style={{ margin: '0 0 10px', color: '#ff7b72', fontSize: '0.95rem' }}>🔨 สถานะประมูลแบบ Live</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px', fontSize: '0.8rem' }}>
                        <div><span style={{ color: '#8b949e' }}>ไอเท็ม: </span><span style={{ color: '#fff' }}>{auctionData.itemId || '—'}</span></div>
                        <div><span style={{ color: '#8b949e' }}>ราคาปัจจุบัน: </span><span style={{ color: '#3fb950' }}>฿{Number(auctionData.price || 0).toLocaleString()}</span></div>
                        <div><span style={{ color: '#8b949e' }}>ผู้นำประมูล: </span><span style={{ color: '#FFD700' }}>{auctionData.bidder || '—'}</span></div>
                        <div><span style={{ color: '#8b949e' }}>จ่ายแล้ว: </span><span style={{ color: auctionData.isPaid ? '#3fb950' : '#da3633' }}>{auctionData.isPaid ? '✅ จ่ายแล้ว' : '⏳ รอชำระ'}</span></div>
                        <div><span style={{ color: '#8b949e' }}>auctionBucket: </span><span style={{ color: '#8b949e' }}>{auctionData.auctionBucket || '—'}</span></div>
                        <div><span style={{ color: '#8b949e' }}>lastReset: </span><span style={{ color: '#8b949e' }}>{auctionData.lastResetBucket || '—'}</span></div>
                    </div>
                </div>
            )}

            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                {/* Control Panel */}
                <div style={{ flex: '1 1 280px', background: '#161b22', border: '1px solid #30363d', borderRadius: '8px', padding: '20px' }}>
                    <h2 style={{ borderBottom: '1px solid #30363d', paddingBottom: '10px', marginTop: 0, fontSize: '1rem' }}>⚡ เครื่องมือ Admin</h2>

                    <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.8rem' }}>ผู้เล่นเป้าหมาย:</label>
                    <select value={selectedUser} onChange={(e) => setSelectedUser(e.target.value)}
                        style={{ width: '100%', padding: '8px', background: '#010409', color: '#fff', border: '1px solid #30363d', borderRadius: '6px', marginBottom: '12px' }}>
                        <option value="">-- เลือกผู้เล่น --</option>
                        {playerList.map(([k, d]) => (
                            <option key={k} value={k}>{d.displayName} ({k}) — ฿{Number(d.money || 0).toLocaleString()}</option>
                        ))}
                    </select>

                    <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                        <input type="number" value={addMoneyAmount} onChange={(e) => setAddMoneyAmount(e.target.value)}
                            style={{ flex: 1, padding: '8px', background: '#010409', color: '#fff', border: '1px solid #30363d', borderRadius: '6px' }} placeholder="จำนวนเงิน" />
                        <button onClick={handleAddMoney} style={{ background: '#2ea043', color: 'white', border: 'none', padding: '8px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>เสกเงิน</button>
                    </div>

                    <input type="text" value={adminMessage} onChange={(e) => setAdminMessage(e.target.value)}
                        style={{ width: '100%', padding: '8px', background: '#010409', color: '#fff', border: '1px solid #30363d', borderRadius: '6px', marginBottom: '16px', boxSizing: 'border-box' }}
                        placeholder="💬 ข้อความถึงผู้เล่น (ไม่บังคับ)" />

                    <button onClick={handleForceRefresh}
                        style={{ width: '100%', background: '#1f6feb', color: 'white', border: 'none', padding: '10px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', marginBottom: '12px' }}>
                        🔄 Force Refresh ทุก Client
                    </button>

                    <div style={{ borderTop: '1px dashed #da3633', paddingTop: '12px' }}>
                        <button onClick={handleResetAllData}
                            style={{ width: '100%', background: 'transparent', color: '#da3633', border: '2px solid #da3633', padding: '10px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
                            ☢️ WIPE ALL DATA
                        </button>
                    </div>
                </div>

                {/* Player Table */}
                <div style={{ flex: '2 1 500px', background: '#161b22', border: '1px solid #30363d', borderRadius: '8px', padding: '20px', overflowX: 'auto' }}>
                    <h2 style={{ borderBottom: '1px solid #30363d', paddingBottom: '10px', marginTop: 0, fontSize: '1rem' }}>
                        👥 ผู้เล่น ({playerList.length}) <span style={{ fontSize: '0.7rem', color: '#3fb950', fontWeight: 'normal' }}>● LIVE</span>
                    </h2>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr>
                                <th style={th}>ชื่อ / Username</th>
                                <th style={th}>เงิน</th>
                                <th style={th}>หนี้</th>
                                <th style={th}>ยูนิต</th>
                                <th style={th}>IPO</th>
                                <th style={th}>ธุรกิจ</th>
                                <th style={th}></th>
                            </tr>
                        </thead>
                        <tbody>
                            {playerList.map(([key, data]) => (
                                <tr key={key} style={{ background: selectedUser === key ? 'rgba(88,166,255,0.05)' : 'transparent' }} onClick={() => setSelectedUser(key)}>
                                    <td style={td}>
                                        <div style={{ color: '#58a6ff', fontWeight: 'bold' }}>{data.displayName}</div>
                                        <div style={{ color: '#484f58', fontSize: '0.75rem' }}>@{key}</div>
                                    </td>
                                    <td style={{ ...td, color: data.money < 0 ? '#da3633' : '#3fb950', fontWeight: 'bold' }}>
                                        ฿{Number(data.money || 0).toLocaleString()}
                                    </td>
                                    <td style={{ ...td, color: data.debt > 0 ? '#da3633' : '#484f58' }}>
                                        {data.debt > 0 ? `฿${Number(data.debt).toLocaleString()}` : '—'}
                                    </td>
                                    <td style={td}>{data.fleetSize || 1}</td>
                                    <td style={td}>{data.isIPO ? '✅' : '—'}</td>
                                    <td style={{ ...td, color: '#8b949e', fontSize: '0.75rem' }}>{data.businessType || 'homestay'}</td>
                                    <td style={td}>
                                        <button onClick={(e) => { e.stopPropagation(); handleDeleteUser(key); }}
                                            style={{ background: '#da3633', color: 'white', border: 'none', padding: '3px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.7rem' }}>
                                            ลบ
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {playerList.length === 0 && (
                                <tr><td colSpan={7} style={{ ...td, textAlign: 'center', color: '#484f58', padding: '30px' }}>ยังไม่มีผู้เล่น</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Stock Market Panel */}
            {playerStocks.length > 0 && (
                <div style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: '8px', padding: '20px', overflowX: 'auto' }}>
                    <h2 style={{ margin: '0 0 12px', fontSize: '1rem' }}>
                        📈 หุ้นในตลาด ({playerStocks.length}) <span style={{ fontSize: '0.7rem', color: '#3fb950', fontWeight: 'normal' }}>● LIVE</span>
                    </h2>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr>
                                <th style={th}>Symbol</th>
                                <th style={th}>บริษัท</th>
                                <th style={th}>ราคา</th>
                                <th style={th}>เปลี่ยนแปลง</th>
                                <th style={th}>Market Cap</th>
                                <th style={th}>กำไรสุทธิ</th>
                                <th style={th}>สุขภาพ</th>
                            </tr>
                        </thead>
                        <tbody>
                            {playerStocks.map((s, i) => {
                                const change = s.prevPrice ? ((s.price - s.prevPrice) / s.prevPrice * 100) : 0;
                                const isUp = change >= 0;
                                return (
                                    <tr key={i}>
                                        <td style={{ ...td, color: '#58a6ff', fontWeight: 'bold' }}>{s.symbol}</td>
                                        <td style={td}>{s.name}</td>
                                        <td style={{ ...td, color: '#3fb950', fontWeight: 'bold' }}>฿{Number(s.price || 0).toLocaleString()}</td>
                                        <td style={{ ...td, color: isUp ? '#3fb950' : '#da3633' }}>{isUp ? '▲' : '▼'} {Math.abs(change).toFixed(2)}%</td>
                                        <td style={td}>฿{Number(s.marketCap || 0).toLocaleString()}</td>
                                        <td style={{ ...td, color: '#3fb950' }}>฿{Number(s.netProfit || 0).toLocaleString()}</td>
                                        <td style={{ ...td, color: s.health === 'ดีเยี่ยม' ? '#3fb950' : s.health === 'เสี่ยง' ? '#da3633' : '#d29922' }}>{s.health || '—'}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {/* System Logs */}
            <div style={{ background: '#010409', border: '1px solid #30363d', borderRadius: '8px', padding: '10px 20px', maxHeight: '160px', overflowY: 'auto' }}>
                <h3 style={{ color: '#8b949e', marginTop: 0, fontSize: '0.85rem' }}>📋 ADMIN ACTION LOGS</h3>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '0.8rem', color: '#8b949e' }}>
                    {logs.map((log, i) => <li key={i} style={{ marginBottom: '3px' }}>{log}</li>)}
                    {logs.length === 0 && <li>ยังไม่มีเหตุการณ์...</li>}
                </ul>
            </div>
        </div>
    );
};

export default AdminDashboard;
