import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { ref, onValue, runTransaction } from "firebase/database";
import { TITLES } from '../config/auctionData.js';

const AuctionHouse = ({ show, item, username, money, inventory, onClose }) => {
    const [currentBid, setCurrentBid] = useState(0);
    const [highestBidder, setHighestBidder] = useState('');
    const [bidAmount, setBidAmount] = useState(0);
    const [showRateInfo, setShowRateInfo] = useState(false);

    // ตรวจสอบว่าผู้เล่นมีฉายานี้อยู่แล้วหรือไม่
    const alreadyOwned = inventory && inventory.includes(item?.id);

    // ดึงข้อมูลการประมูลแบบ Real-time
    useEffect(() => {
        if (!item) return;
        const auctionRef = ref(db, `global_auction`);
        const unsubscribe = onValue(auctionRef, (snap) => {
            if (snap.exists()) {
                const data = snap.val();
                setCurrentBid(data.price || 0);
                setHighestBidder(data.bidder || 'ไม่มี');
                setBidAmount(data.price > 0 ? data.price + 10000 : item.minBid);
            } else {
                setCurrentBid(0);
                setHighestBidder('ไม่มี');
                setBidAmount(item.minBid);
            }
        });
        return () => unsubscribe();
    }, [item]);

    const handleBid = async () => {
        if (alreadyOwned) return;
        if (money < bidAmount) return alert("❌ เงินไม่พอประมูล!");

        // ตรวจสอบราคาประมูลขั้นต่ำสำหรับครั้งแรก
        if (currentBid === 0 && bidAmount < item.minBid) {
            return alert(`❌ ราคาประมูลขั้นต่ำสำหรับฉายานี้คือ ฿${item.minBid.toLocaleString()}`);
        }

        // ตรวจสอบกรณีมีการสู้ราคา
        if (currentBid > 0 && bidAmount <= currentBid) {
            return alert("❌ ราคาเสนอต้องสูงกว่าราคาปัจจุบัน!");
        }

        const auctionRef = ref(db, `global_auction`);
        try {
            await runTransaction(auctionRef, (currentData) => {
                // ป้องกันการกดซ้อนถ้ามีคนให้ราคาสูงกว่าไปแล้วระหว่างทาง
                if (currentData && currentData.price >= bidAmount) {
                    return;
                }
                return {
                    ...currentData,
                    price: bidAmount,
                    bidder: username,
                    timestamp: Date.now(),
                    itemId: item.id,
                    isPaid: false // ต้องเป็น false เสมอเมื่อมีการ Bid ใหม่
                };
            });
        } catch (error) {
            console.error("Bidding error:", error);
        }
    };

    if (!show || !item) return null;

    return (
        <div className="glass-overlay" style={{ zIndex: 10000 }}>
            <div className="glass-panel" style={{ padding: '30px', maxWidth: '400px', width: '90%', border: `2px solid ${item.color}`, position: 'relative' }}>
                <button onClick={onClose} style={{ position: 'absolute', top: '10px', right: '10px', background: 'none', border: 'none', color: '#fff', fontSize: '1.2rem', cursor: 'pointer' }}>×</button>

                {/* เพิ่มปุ่ม i ที่มุมซ้ายบนของ Panel */}
                <button
                    onClick={() => setShowRateInfo(true)}
                    style={{ position: 'absolute', top: '10px', left: '10px', background: 'rgba(255,255,255,0.1)', border: 'none', color: '#00E1FF', borderRadius: '50%', width: '25px', height: '25px', cursor: 'pointer' }}
                >
                    i
                </button>

                <h2 style={{ color: item.color, textAlign: 'center' }}>🔨 การประมูลข้ามโลก!</h2>

                <div
                    style={{ background: 'rgba(0,0,0,0.5)', padding: '20px', borderRadius: '15px', margin: '20px 0', textAlign: 'center', cursor: 'help' }}
                    title={`โอกาสสุ่มพบ: ${item.dropRate}%`}
                >
                    <h1 style={{ color: item.color, margin: '0', fontSize: '1.8rem' }}>{item.name}</h1>
                    <p style={{ fontSize: '0.8rem', color: '#aaa', margin: '5px 0' }}>
                        ระดับ: <span style={{
                            color: item.rarity === 'Legendary' ? '#ff0055' :
                                item.rarity === 'Epic' ? '#a335ee' :
                                    item.rarity === 'Rare' ? '#0070dd' :
                                        item.rarity === 'Common' ? '#1eff00' : '#aaaaaa'
                        }}>{item.rarity}</span> | <span style={{ color: '#00E1FF' }}>โอกาส: {item.dropRate}%</span>
                    </p>
                    {/* เพิ่มการแสดงราคาประมูลขั้นต่ำ */}
                    <p style={{ fontSize: '0.85rem', color: '#00ff88', fontWeight: 'bold' }}>
                        ราคาเริ่มต้น: ฿{item.minBid.toLocaleString()}
                    </p>
                    {/* แสดงข้อความเมื่อมีฉายาแล้ว */}
                    {alreadyOwned && (
                        <p style={{ color: '#ffD700', fontSize: '0.9rem', fontWeight: 'bold', marginTop: '10px' }}>
                            ✨ คุณครอบครองฉายานี้แล้ว
                        </p>
                    )}
                    <hr style={{ opacity: 0.1, margin: '10px 0' }} />
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', fontSize: '0.75rem', textAlign: 'left' }}>
                        {item.hypeBonus > 0 && <div>🔥 Hype: <span style={{ color: '#ff4757', fontWeight: 'bold' }}>+{item.hypeBonus}%</span></div>}
                        {item.repBonus > 0 && <div>⭐ Rep: <span style={{ color: '#FFD700', fontWeight: 'bold' }}>+{item.repBonus}</span></div>}
                        {item.incomeBonus > 0 && <div>💰 รายได้: <span style={{ color: '#00ff88', fontWeight: 'bold' }}>+{(item.incomeBonus * 100).toFixed(0)}%</span></div>}
                        {item.loanBonus > 0 && <div>🏦 วงเงินกู้: <span style={{ color: '#00E1FF', fontWeight: 'bold' }}>+฿{item.loanBonus.toLocaleString()}</span></div>}
                        {item.stockBonus > 1 && <div>📈 ราคาหุ้น: <span style={{ color: '#a335ee', fontWeight: 'bold' }}>x{item.stockBonus.toFixed(2)}</span></div>}
                    </div>
                </div>

                <div style={{ marginBottom: '20px', textAlign: 'center' }}>
                    <p style={{ margin: '5px 0' }}>ราคาปัจจุบัน: <strong style={{ fontSize: '1.5rem', color: '#00ff88' }}>฿{currentBid.toLocaleString()}</strong></p>
                    <p style={{ margin: '5px 0' }}>ผู้นำประมูล: <span style={{ color: '#ffD700' }}>{highestBidder}</span></p>
                </div>

                {!alreadyOwned && (
                    <>
                        <p style={{ fontSize: '0.7rem', color: '#00E1FF', marginBottom: '5px', textAlign: 'left', fontWeight: 'bold' }}>
                            {currentBid === 0
                                ? `📢 เริ่มต้นประมูลที่ ฿${item.minBid.toLocaleString()}`
                                : `📈 ต้องเสนอราคาสูงกว่า ฿${currentBid.toLocaleString()}`}
                        </p>
                        <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                            <input
                                type="number"
                                value={bidAmount}
                                onChange={(e) => setBidAmount(Number(e.target.value))}
                                style={{ flex: 1, padding: '10px', background: '#000', color: '#fff', border: '1px solid #333', borderRadius: '8px' }}
                                placeholder="ใส่ราคาประมูล"
                            />
                        </div>
                    </>
                )}

                <button
                    className="primary-btn"
                    style={{
                        background: alreadyOwned ? '#333' : 'linear-gradient(to right, #ff0055, #ff4757)',
                        border: 'none',
                        padding: '12px',
                        fontSize: '1rem',
                        fontWeight: 'bold',
                        width: '100%',
                        marginBottom: '10px',
                        cursor: alreadyOwned ? 'default' : 'pointer',
                        opacity: alreadyOwned ? 0.6 : 1
                    }}
                    onClick={handleBid}
                    disabled={alreadyOwned}
                >
                    {alreadyOwned ? "คุณมีฉายานี้แล้ว (ดูเท่านั้น)" : `เสนอราคา ฿${bidAmount.toLocaleString()}`}
                </button>

                <p style={{ fontSize: '0.8rem', color: '#ff4757', textAlign: 'center', fontWeight: 'bold' }}>
                    {alreadyOwned
                        ? "✨ คุณมีฉายานี้แล้ว"
                        : `⚠️ หากชนะแต่เงินไม่พอ จะโดนปรับ ฿${(bidAmount * 0.2).toLocaleString()} (20%)`}
                </p>
                <p style={{ fontSize: '0.7rem', color: '#888', textAlign: 'center' }}>
                    {!alreadyOwned && "*เงินจะถูกหักเมื่อคุณชนะการประมูลเมื่อจบเวลาเท่านั้น*"}
                </p>

                <button className="secondary-btn" onClick={onClose} style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '8px', borderRadius: '8px', cursor: 'pointer' }}>ปิดหน้าต่าง</button>
            </div>

            {/* ส่วนของ Modal แสดง Rate (จะแสดงเมื่อ showRateInfo เป็น true) */}
            {showRateInfo && (
                <div className="glass-overlay" style={{ zIndex: 10001, background: 'rgba(0,0,0,0.8)' }}>
                    <div className="glass-panel" style={{ padding: '20px', maxWidth: '350px', fontSize: '0.8rem' }}>
                        <h3 style={{ textAlign: 'center', color: '#00E1FF' }}>📊 อัตราการสุ่มฉายา</h3>
                        <div style={{ maxHeight: '300px', overflowY: 'auto', marginBottom: '15px' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ borderBottom: '1px solid #333' }}>
                                        <th style={{ textAlign: 'left', padding: '5px' }}>ชื่อฉายา</th>
                                        <th style={{ textAlign: 'right', padding: '5px' }}>โอกาส</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {Object.values(TITLES).map((t) => (
                                        <tr key={t.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                            <td style={{ color: t.color, padding: '5px' }}>{t.name}</td>
                                            <td style={{ textAlign: 'right', padding: '5px' }}>{t.dropRate}%</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <button className="secondary-btn" onClick={() => setShowRateInfo(false)} style={{ width: '100%' }}>ปิด</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AuctionHouse;
