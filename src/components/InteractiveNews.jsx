import React, { useState, useEffect } from 'react';

const InteractiveNews = ({ currentEvent, logs, onChoiceSelect, auctionTimeLeft, isAuctionPhase }) => {
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    let timer;
    if (currentEvent.choices && currentEvent.duration) {
      setTimeLeft(currentEvent.duration);

      timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            onChoiceSelect(currentEvent.timeoutPenalty, true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [currentEvent, onChoiceSelect]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>

      {/* ส่วน Countdown ใหม่ */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', fontSize: '0.7rem' }}>
        <span style={{ color: isAuctionPhase ? '#ff4757' : '#00E1FF' }}>
          {isAuctionPhase ? '🔥 ช่วงเวลาประมูล!' : '📊 ตลาดรอบใหม่ใน:'}
        </span>
        <span style={{ fontWeight: 'bold' }}>{auctionTimeLeft} วิ</span>
      </div>

      <div className="news-ticker" style={{ borderLeft: `4px solid ${isAuctionPhase ? '#FFD700' : (currentEvent.choices ? '#ff4757' : '#00E1FF')}`, flexShrink: 0 }}>
        <span className="ticker-label" style={{ color: isAuctionPhase ? '#FFD700' : (currentEvent.choices ? '#ff4757' : '#00E1FF') }}>
          {isAuctionPhase ? 'AUCTION:' : (currentEvent.choices ? 'URGENT:' : 'MARKET:')}
        </span>
        <span className="ticker-text">
          {isAuctionPhase ? 'กำลังเปิดประมูลฉายาลับ!' : currentEvent.msg}
        </span>
      </div>

      {currentEvent.choices && !isAuctionPhase && (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          padding: '10px',
          background: 'rgba(255, 71, 87, 0.15)',
          borderRadius: '10px',
          marginBottom: '10px',
          flexShrink: 0,
          maxHeight: '140px',
          overflowY: 'auto'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
            <span style={{ fontSize: '0.75rem', color: '#ff4757', fontWeight: 'bold' }}>⚠️ ตัดสินใจด่วน! (เหลือเวลา {timeLeft} วินาที)</span>
          </div>

          <div style={{ width: '100%', height: '6px', background: 'rgba(0,0,0,0.5)', borderRadius: '3px', marginBottom: '10px' }}>
            <div style={{
              height: '100%',
              width: `${(timeLeft / currentEvent.duration) * 100}%`,
              background: timeLeft <= 10 ? '#ff4757' : '#00ff88',
              transition: 'width 1s linear',
              borderRadius: '3px',
              boxShadow: timeLeft <= 10 ? '0 0 10px #ff4757' : 'none'
            }} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px' }}>
            {currentEvent.choices.map((choice, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setTimeLeft(0);
                  if (choice.isRisky) {
                    const isSuccess = Math.random() < choice.successRate;
                    const finalOutcome = isSuccess ? choice.success : choice.fail;
                    onChoiceSelect(finalOutcome, false);
                  } else {
                    onChoiceSelect(choice, false);
                  }
                }}
                style={{ padding: '6px', fontSize: '0.65rem', background: 'rgba(0,0,0,0.5)', color: choice.isRisky ? '#FFD700' : '#fff', border: `1px solid ${choice.isRisky ? 'rgba(255, 215, 0, 0.5)' : 'rgba(255,255,255,0.2)'}`, borderRadius: '6px', cursor: 'pointer' }}
              >
                {choice.text}
              </button>
            ))}
          </div>
        </div>
      )}

      <div style={{
        flex: 1,
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch',
        paddingRight: '5px'
      }}>
        <span className="section-title">บันทึกเหตุการณ์ (Logs)</span>
        {logs.map((log, i) => (
          <p key={i} className="log-item" style={{ fontSize: '0.75rem', margin: '4px 0' }}>
            <span style={{ color: log.includes('หายนะ') || log.includes('ล้มละลาย') || log.includes('พังพินาศ') || log.includes('หนี้ท่วม') ? '#ff4757' : '#00ff88' }}>•</span> {log}
          </p>
        ))}
      </div>
    </div>
  );
};

export default InteractiveNews;