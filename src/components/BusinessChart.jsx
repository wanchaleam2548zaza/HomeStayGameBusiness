import React from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, Brush } from 'recharts';

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div style={{
        backgroundColor: 'rgba(10, 15, 30, 0.85)',
        border: `1px solid ${data.isLoss ? 'rgba(255, 71, 87, 0.5)' : 'rgba(0, 225, 255, 0.3)'}`,
        borderRadius: '12px', padding: '12px 15px', backdropFilter: 'blur(8px)'
      }}>
        <p style={{ color: 'rgba(255,255,255,0.6)', margin: '0 0 5px 0', fontSize: '0.8rem' }}>เวลา: {data.time}</p>
        <p style={{ color: data.isLoss ? '#ff4757' : '#00E1FF', margin: 0, fontWeight: 'bold', fontSize: '1.2rem' }}>
          ฿{data.value.toLocaleString()}
        </p>
        {data.reason && <p style={{ color: '#ff4757', fontSize: '0.85rem', marginTop: '8px' }}>🔻 {data.reason}</p>}
      </div>
    );
  }
  return null;
};

const CustomDot = (props) => {
  const { cx, cy, payload } = props;
  if (payload.isLoss) return <circle cx={cx} cy={cy} r={5} fill="#ff4757" stroke="#fff" strokeWidth={2} />;
  return null;
};

const BusinessChart = ({ data }) => (
  <ResponsiveContainer width="100%" height="100%">
    <AreaChart data={data}>
      <defs>
        <linearGradient id="waterWave" x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%" stopColor="#00E1FF" stopOpacity={0.8}/>
          <stop offset="95%" stopColor="#0055FF" stopOpacity={0}/>
        </linearGradient>
      </defs>
      <XAxis dataKey="time" hide />
      <YAxis domain={['dataMin - 100', 'auto']} hide />
      <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255, 255, 255, 0.1)', strokeWidth: 2 }} />
      <Area 
        type="monotone" dataKey="value" stroke="#00E1FF" strokeWidth={3} 
        fillOpacity={1} fill="url(#waterWave)" 
        dot={<CustomDot />} activeDot={{ r: 6, fill: '#fff', stroke: '#00E1FF', strokeWidth: 2 }}
        isAnimationActive={true} animationDuration={400} 
      />
      <Brush dataKey="time" height={25} stroke="rgba(0, 225, 255, 0.4)" fill="rgba(0,0,0,0.6)" travellerWidth={12} tickFormatter={() => ''} />
    </AreaChart>
  </ResponsiveContainer>
);

export default BusinessChart;