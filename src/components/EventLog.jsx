// src/components/EventLog.jsx
import React from 'react';

const EventLog = ({ currentEvent, logs }) => (
  <section className="event-log">
    <div className="news-ticker">
      <span className="ticker-label">BREAKING NEWS:</span>
      <span className="ticker-text">{currentEvent.msg}</span>
    </div>
    <div className="log-list">
      {logs.map((log, i) => (
        <p key={i} className="log-item">{log}</p>
      ))}
    </div>
  </section>
);

export default EventLog;