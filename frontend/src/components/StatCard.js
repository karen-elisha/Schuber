import React from 'react';

export default function StatCard({ icon, label, value, sub, color = '#F59E0B', trend }) {
  return (
    <div style={s.card}>
      <div style={{ ...s.iconWrap, background: color + '18', color }}>
        {icon}
      </div>
      <div style={s.body}>
        <div style={s.label}>{label}</div>
        <div style={s.value}>{value}</div>
        {sub && <div style={s.sub}>{sub}</div>}
      </div>
      {trend && (
        <div style={{ ...s.trend, color: trend > 0 ? '#059669' : '#DC2626' }}>
          {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
        </div>
      )}
    </div>
  );
}

const s = {
  card: { background: '#FFFFFF', border: '1px solid #FDE68A', borderRadius: 14, padding: '1.25rem', display: 'flex', gap: '1rem', alignItems: 'flex-start', boxShadow: '0 1px 4px rgba(245,158,11,0.08)' },
  iconWrap: { width: 44, height: 44, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', flexShrink: 0 },
  body: { flex: 1 },
  label: { color: '#78716C', fontSize: '0.75rem', marginBottom: '0.2rem', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 },
  value: { fontFamily: "'Syne', sans-serif", fontSize: '1.6rem', fontWeight: 700, lineHeight: 1.1, color: '#1C1917' },
  sub: { color: '#A8A29E', fontSize: '0.73rem', marginTop: '0.25rem' },
  trend: { fontSize: '0.8rem', fontWeight: 700, flexShrink: 0 },
};
