import React, { useState } from 'react';

const StockMarket = ({ show, onClose, money, marketStocks, portfolio, onBuy, onSell, username }) => {
  const [amount, setAmount] = useState(1);
  const [activeTab, setActiveTab] = useState('all'); // 'all' หรือ 'portfolio'

  if (!show) return null;

  // กรองหุ้นตาม Tab ที่เลือก
  const displayedStocks = activeTab === 'all'
    ? marketStocks
    : marketStocks.filter(stock => portfolio[stock.symbol] && portfolio[stock.symbol].shares > 0);

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(5px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999 }} onClick={onClose}>
      <div className="glass-window" onClick={e => e.stopPropagation()} style={{ background: 'rgba(15, 20, 35, 0.95)', border: '1px solid rgba(0, 255, 136, 0.3)', borderRadius: '20px', width: '95%', maxWidth: '600px', maxHeight: '85vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Header Section */}
        <div style={{ padding: '15px 20px', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.2)' }}>
          <div>
            <span style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#00ff88' }}>📈 ตลาดหุ้นมหาชน</span>
            <p style={{ margin: 0, fontSize: '0.75rem', color: '#aaa' }}>เงินสด: <strong style={{ color: '#fff' }}>฿{Math.floor(money).toLocaleString()}</strong></p>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', borderRadius: '50%', width: '30px', height: '30px', cursor: 'pointer' }}>✕</button>
        </div>

        {/* Tab Switcher - เลือกดูหุ้นทั้งหมด หรือ หุ้นที่เราถือ */}
        <div style={{ display: 'flex', background: 'rgba(0,0,0,0.3)', padding: '5px' }}>
          <button
            onClick={() => setActiveTab('all')}
            style={{ flex: 1, padding: '10px', background: activeTab === 'all' ? 'rgba(0,255,136,0.15)' : 'transparent', border: 'none', color: activeTab === 'all' ? '#00ff88' : '#888', borderBottom: activeTab === 'all' ? '2px solid #00ff88' : 'none', cursor: 'pointer', fontWeight: 'bold', transition: '0.2s' }}
          >
            หุ้นทั้งหมด ({marketStocks.length})
          </button>
          <button
            onClick={() => setActiveTab('portfolio')}
            style={{ flex: 1, padding: '10px', background: activeTab === 'portfolio' ? 'rgba(0,255,136,0.15)' : 'transparent', border: 'none', color: activeTab === 'portfolio' ? '#00ff88' : '#888', borderBottom: activeTab === 'portfolio' ? '2px solid #00ff88' : 'none', cursor: 'pointer', fontWeight: 'bold', transition: '0.2s' }}
          >
            พอร์ตของฉัน ({Object.keys(portfolio).length})
          </button>
        </div>

        {/* Scrollable Content */}
        <div style={{ overflowY: 'auto', flex: 1, position: 'relative' }}>

          {/* 🟢 Sticky Quick Trade: แถบตั้งจำนวนหุ้นจะล็อคอยู่ด้านบนเสมอเวลาเลื่อน */}
          <div style={{ position: 'sticky', top: 0, zIndex: 10, background: 'rgba(15, 20, 35, 1)', padding: '12px 20px', borderBottom: '1px solid rgba(255,255,255,0.05)', boxShadow: '0 4px 10px rgba(0,0,0,0.3)' }}>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.8rem', color: '#888' }}>จำนวนที่ต้องการเทรด: </span>
              <input type="number" min="1" value={amount} onChange={(e) => setAmount(Math.max(1, parseInt(e.target.value) || 1))} style={{ background: 'rgba(0,0,0,0.5)', color: '#fff', border: '1px solid #444', padding: '4px 8px', borderRadius: '5px', width: '80px', textAlign: 'center' }} />
            </div>
            <div style={{ display: 'flex', gap: '6px' }}>
              {[1, 10, 50, 100, 1000].map(num => (
                <button key={num} onClick={() => setAmount(num)} style={{ flex: 1, padding: '6px 2px', background: amount === num ? 'rgba(0,255,136,0.2)' : 'rgba(255,255,255,0.05)', color: amount === num ? '#00ff88' : '#ccc', border: `1px solid ${amount === num ? '#00ff88' : 'transparent'}`, borderRadius: '6px', fontSize: '0.75rem', cursor: 'pointer' }}>
                  {num}
                </button>
              ))}
            </div>
          </div>

          {/* Stock List */}
          <div style={{ padding: '15px', display: 'grid', gap: '12px' }}>
            {displayedStocks.length > 0 ? displayedStocks.map(stock => {
              const myStock = portfolio[stock.symbol] || { shares: 0, avgCost: 0 };
              const isUp = stock.price >= stock.prevPrice;
              const isMyOwnCompany = stock.owner === username;
              const costTotal = stock.price * amount;

              const canBuy = money >= costTotal && !isMyOwnCompany;
              const canSell = myStock.shares >= amount && !isMyOwnCompany;

              const profitLoss = myStock.shares > 0 ? (stock.price - myStock.avgCost) * myStock.shares : 0;

              return (
                <div key={stock.symbol} style={{ background: 'rgba(255,255,255,0.03)', padding: '15px', borderRadius: '15px', border: `1px solid ${isMyOwnCompany ? 'rgba(0, 225, 255, 0.3)' : 'rgba(255,255,255,0.1)'}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <div>
                      <span style={{ fontSize: '1rem', fontWeight: 'bold', color: isMyOwnCompany ? '#00e1ff' : '#fff' }}>{stock.symbol}</span>
                      <span style={{ fontSize: '0.7rem', color: '#666', marginLeft: '6px' }}>{stock.name}</span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ color: isUp ? '#00ff88' : '#ff4757', fontWeight: 'bold' }}>฿{stock.price.toLocaleString()}</span>
                      <div style={{ fontSize: '0.7rem', color: isUp ? '#00ff88' : '#ff4757' }}>
                        {isUp ? '▲' : '▼'} {stock.prevPrice !== 0 ? Math.abs(((stock.price - stock.prevPrice) / stock.prevPrice * 100)).toFixed(2) : '0.00'}%
                      </div>
                    </div>
                  </div>

                  <div style={{
                    margin: '10px 0',
                    padding: '10px',
                    background: 'rgba(0,0,0,0.3)',
                    borderRadius: '10px',
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '8px',
                    fontSize: '0.65rem'
                  }}>
                    <div style={{ color: '#aaa' }}>Market Cap: <span style={{ color: '#fff' }}>฿{(stock.marketCap || 0).toLocaleString()}</span></div>
                    <div style={{ color: '#aaa' }}>กำไรสุทธิ: <span style={{ color: '#00ff88' }}>฿{(stock.netProfit || 0).toLocaleString()}/s</span></div>
                    <div style={{ color: '#aaa' }}>ความมั่นคง: <span style={{
                      color: stock.health === 'ดีเยี่ยม' ? '#00ff88' : (stock.health === 'เสี่ยง' ? '#ff4757' : '#ffb300')
                    }}>{stock.health || 'N/A'}</span></div>
                    <div style={{ color: '#aaa' }}>ปันผลคาดการณ์: <span style={{ color: '#FFD700' }}>฿{stock.dividend || 0}</span></div>
                  </div>

                  {myStock.shares > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: '#aaa', padding: '6px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', marginBottom: '10px' }}>
                      <span>ถือครอง: {myStock.shares}</span>
                      <span style={{ color: profitLoss >= 0 ? '#00ff88' : '#ff4757' }}>
                        P/L: {profitLoss > 0 ? '+' : ''}{Math.floor(profitLoss).toLocaleString()}
                      </span>
                    </div>
                  )}

                  {isMyOwnCompany ? (
                    <div style={{ fontSize: '0.7rem', color: '#00e1ff', textAlign: 'center', padding: '8px', border: '1px dashed #00e1ff', borderRadius: '8px' }}>
                      🏢 บริษัทของคุณเอง
                    </div>
                  ) : (
                    <>
                      {/* ปุ่ม BUY / SELL ปกติ */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                        <button onClick={() => onBuy(stock.symbol, stock.price, amount)} disabled={!canBuy} style={{ padding: '8px', background: canBuy ? 'rgba(0,255,136,0.15)' : 'transparent', color: canBuy ? '#00ff88' : '#444', border: `1px solid ${canBuy ? '#00ff88' : '#333'}`, borderRadius: '8px', cursor: canBuy ? 'pointer' : 'not-allowed', fontSize: '0.8rem' }}>BUY ×{amount}</button>
                        <button onClick={() => onSell(stock.symbol, stock.price, amount)} disabled={!canSell} style={{ padding: '8px', background: canSell ? 'rgba(255,71,87,0.15)' : 'transparent', color: canSell ? '#ff4757' : '#444', border: `1px solid ${canSell ? '#ff4757' : '#333'}`, borderRadius: '8px', cursor: canSell ? 'pointer' : 'not-allowed', fontSize: '0.8rem' }}>SELL ×{amount}</button>
                      </div>

                      {/* ปุ่ม ALL IN / SELL ALL */}
                      {(() => {
                        const maxBuy = Math.min(Math.floor(money / stock.price), 200 - (myStock.shares || 0));
                        const canAllIn = maxBuy > 0;
                        const canSellAll = myStock.shares > 0;
                        return (
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '6px' }}>
                            <button
                              onClick={() => onBuy(stock.symbol, stock.price, maxBuy)}
                              disabled={!canAllIn}
                              style={{
                                padding: '7px',
                                background: canAllIn ? 'rgba(0,255,136,0.3)' : 'transparent',
                                color: canAllIn ? '#00ff88' : '#444',
                                border: `1px solid ${canAllIn ? '#00ff88' : '#333'}`,
                                borderRadius: '8px',
                                cursor: canAllIn ? 'pointer' : 'not-allowed',
                                fontSize: '0.7rem',
                                fontWeight: 'bold'
                              }}
                            >
                              🔥 ALL IN ({maxBuy})
                            </button>
                            <button
                              onClick={() => onSell(stock.symbol, stock.price, myStock.shares)}
                              disabled={!canSellAll}
                              style={{
                                padding: '7px',
                                background: canSellAll ? 'rgba(255,71,87,0.3)' : 'transparent',
                                color: canSellAll ? '#ff4757' : '#444',
                                border: `1px solid ${canSellAll ? '#ff4757' : '#333'}`,
                                borderRadius: '8px',
                                cursor: canSellAll ? 'pointer' : 'not-allowed',
                                fontSize: '0.7rem',
                                fontWeight: 'bold'
                              }}
                            >
                              💸 SELL ALL ({myStock.shares || 0})
                            </button>
                          </div>
                        );
                      })()}
                    </>
                  )}
                </div>
              );
            }) : (
              <div style={{ textAlign: 'center', color: '#555', padding: '40px' }}>
                {activeTab === 'portfolio' ? 'ไม่มีหุ้นในพอร์ต' : 'ไม่พบข้อมูลหุ้น'}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StockMarket;