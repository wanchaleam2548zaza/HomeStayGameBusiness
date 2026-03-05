import React from 'react';

const IncomeModal = ({ show, incomeData, onAccept, onBankrupt }) => {
    if (!show || !incomeData) return null;

    const { grossRevenue, tax, salary, netIncome, canAfford } = incomeData;

    if (!canAfford) {
        // หน้า Alert บังคับล้มละลาย
        return (
            <div style={{
                position: 'fixed', inset: 0, zIndex: 9000,
                background: 'rgba(0,0,0,0.85)',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
                <div style={{
                    background: 'rgba(20,0,0,0.97)',
                    border: '2px solid #da3633',
                    borderRadius: '20px',
                    padding: '32px',
                    maxWidth: '420px',
                    width: '90%',
                    textAlign: 'center',
                    color: '#fff',
                    fontFamily: 'sans-serif',
                    animation: 'fadeIn 0.3s ease'
                }}>
                    <div style={{ fontSize: '3rem', marginBottom: '10px' }}>☠️</div>
                    <h2 style={{ color: '#da3633', marginTop: 0 }}>บริษัทล้มละลาย!</h2>
                    <p style={{ color: '#ccc', marginBottom: '5px' }}>ไม่มีเงินเพียงพอจ่ายค่าใช้จ่ายประจำงวด</p>
                    <div style={{
                        background: 'rgba(218,54,51,0.1)', border: '1px solid rgba(218,54,51,0.3)',
                        borderRadius: '10px', padding: '15px', margin: '15px 0', textAlign: 'left'
                    }}>
                        <p style={{ margin: '4px 0', color: '#ff6b6b' }}>💸 ภาษีที่ต้องจ่าย: ฿{tax.toLocaleString()}</p>
                        <p style={{ margin: '4px 0', color: '#ff6b6b' }}>👔 เงินเดือนพนักงาน: ฿{salary.toLocaleString()}</p>
                        <p style={{ margin: '8px 0 0', fontWeight: 'bold', color: '#da3633', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '8px' }}>
                            ขาดทุน: ฿{Math.abs(netIncome).toLocaleString()}
                        </p>
                    </div>
                    <p style={{ color: '#aaa', fontSize: '0.85rem', marginBottom: '20px' }}>
                        คุณต้องยื่นเรื่องล้มละลาย และเริ่มธุรกิจใหม่ตั้งแต่ต้น
                    </p>
                    <button onClick={onBankrupt} style={{
                        width: '100%', background: '#da3633', color: 'white',
                        border: 'none', padding: '14px', borderRadius: '10px',
                        fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer'
                    }}>
                        🏳️ เซ็น เอกสารล้มละลาย
                    </button>
                </div>
            </div>
        );
    }

    // หน้ารับเงินปกติ
    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 9000,
            background: 'rgba(0,0,0,0.75)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
            <div style={{
                background: 'rgba(10, 20, 35, 0.97)',
                border: '2px solid rgba(0, 225, 255, 0.4)',
                borderRadius: '20px',
                padding: '30px',
                maxWidth: '420px',
                width: '90%',
                color: '#fff',
                fontFamily: 'sans-serif',
                boxShadow: '0 0 40px rgba(0, 225, 255, 0.2)'
            }}>
                <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                    <div style={{ fontSize: '2.5rem' }}>💰</div>
                    <h2 style={{ margin: '5px 0', color: '#00E1FF' }}>สรุปรายได้งวดนี้</h2>
                    <p style={{ color: '#aaa', fontSize: '0.8rem', margin: 0 }}>รอบ 2 นาทีเสร็จสิ้น</p>
                </div>

                <div style={{
                    background: 'rgba(255,255,255,0.04)',
                    borderRadius: '12px', padding: '16px',
                    display: 'flex', flexDirection: 'column', gap: '10px'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ color: '#aaa' }}>📈 รายได้รวม</span>
                        <span style={{ color: '#00ff88', fontWeight: 'bold', fontSize: '1.1rem' }}>+฿{grossRevenue.toLocaleString()}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ color: '#aaa' }}>🏛️ ภาษีรัฐบาล (10%)</span>
                        <span style={{ color: '#ff4757' }}>-฿{tax.toLocaleString()}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ color: '#aaa' }}>👔 เงินเดือนพนักงาน</span>
                        <span style={{ color: '#ff4757' }}>-฿{salary.toLocaleString()}</span>
                    </div>
                    {incomeData.debtPayment > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ color: '#aaa' }}>🏦 หักหนี้อัตโนมัติ (5%)</span>
                            <span style={{ color: '#00E1FF' }}>-฿{incomeData.debtPayment.toLocaleString()}</span>
                        </div>
                    )}
                    <div style={{
                        borderTop: '1px solid rgba(255,255,255,0.1)',
                        paddingTop: '10px',
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                    }}>
                        <span style={{ fontWeight: 'bold', fontSize: '1rem' }}>💵 กำไรสุทธิ</span>
                        <span style={{
                            fontWeight: 'bold', fontSize: '1.3rem',
                            color: netIncome >= 0 ? '#00ff88' : '#ff4757'
                        }}>
                            {netIncome >= 0 ? '+' : ''}฿{netIncome.toLocaleString()}
                        </span>
                    </div>
                </div>

                <button onClick={onAccept} style={{
                    width: '100%', marginTop: '20px',
                    background: 'linear-gradient(135deg, #00E1FF, #00ff88)',
                    color: '#000', border: 'none', padding: '14px',
                    borderRadius: '12px', fontSize: '1rem',
                    fontWeight: 'bold', cursor: 'pointer'
                }}>
                    รับเงิน ✓
                </button>
            </div>
        </div>
    );
};

export default IncomeModal;
