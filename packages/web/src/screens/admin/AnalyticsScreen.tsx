// AnalyticsScreen — аналитика и метрики админ-панели
// DAU/MAU, messages, new users, retention, time range, top channels, top users

import { useState } from 'react';

// --- Types ---
interface TimeSeriesPoint {
  label: string;
  value: number;
}

interface MetricCard {
  id: string;
  label: string;
  value: string | number;
  trend: string;
  trendUp: boolean;
  color: string;
  chartData: TimeSeriesPoint[];
  chartColor: string;
}

interface TopItem {
  name: string;
  value: number;
  color: string;
}

// --- Time range options ---
const TIME_RANGES = [
  { key: '7d', label: '7 дней' },
  { key: '30d', label: '30 дней' },
  { key: '90d', label: '90 дней' },
  { key: '1y', label: '1 год' },
];

// --- Mock data generators ---
function generateWeeklyData(base: number, growth: number): TimeSeriesPoint[] {
  const days = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
  return days.map((label, i) => ({
    label,
    value: base + growth * i,
  }));
}

function generateMonthlyData(base: number, growth: number): TimeSeriesPoint[] {
  const months = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'];
  return months.map((label, i) => ({
    label,
    value: Math.round(base + growth * i * 0.5 + Math.random() * 500),
  }));
}

// --- SVG Mini Chart Component ---
function MiniChart({ data, color, height = 40 }: { data: TimeSeriesPoint[]; color: string; height?: number }) {
  const maxVal = Math.max(...data.map((d) => d.value));
  const minVal = Math.min(...data.map((d) => d.value));
  const range = maxVal - minVal || 1;
  const width = 120;
  const padding = 2;

  const points = data.map((d, i) => {
    const x = padding + (i / (data.length - 1)) * (width - 2 * padding);
    const y = height - padding - ((d.value - minVal) / range) * (height - 2 * padding);
    return `${x},${y}`;
  }).join(' ');

  const areaPoints = `${padding},${height - padding} ${points} ${width - padding},${height - padding}`;

  return (
    <svg width={width} height={height} style={{ display: 'block' }}>
      <defs>
        <linearGradient id={`grad-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.3} />
          <stop offset="100%" stopColor={color} stopOpacity={0.02} />
        </linearGradient>
      </defs>
      <polygon points={areaPoints} fill={`url(#grad-${color.replace('#', '')})`} />
      <polyline points={points} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// --- Bar Chart Component ---
function BarChart({ data, color, height = 140 }: { data: TimeSeriesPoint[]; color: string; height?: number }) {
  const maxVal = Math.max(...data.map((d) => d.value));
  const barWidth = Math.min(40, (80 - data.length * 4) / data.length);
  const padding = 30;

  return (
    <div style={{ width: '100%', overflowX: 'auto' }}>
      <svg width="100%" height={height} viewBox={`0 0 ${data.length * (barWidth + 4) + padding * 2} ${height}`} preserveAspectRatio="xMidYMid meet">
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
          const y = height - padding - ratio * (height - 2 * padding);
          return (
            <line key={ratio} x1={padding} y1={y} x2="100%" y2={y} stroke="var(--border-color)" strokeWidth={0.5} strokeDasharray="4,4" />
          );
        })}
        {/* Bars */}
        {data.map((d, i) => {
          const barHeight = (d.value / maxVal) * (height - 2 * padding);
          const x = padding + i * (barWidth + 4);
          const y = height - padding - barHeight;
          return (
            <g key={i}>
              <rect x={x} y={y} width={barWidth} height={barHeight} fill={color} rx={2} opacity={0.85} />
              <text x={x + barWidth / 2} y={height - 8} textAnchor="middle" fontSize={9} fill="var(--text-muted)">
                {d.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// --- Horizontal Bar for top items ---
function HorizontalBar({ item, maxVal, index }: { item: TopItem; maxVal: number; index: number }) {
  const widthPct = maxVal > 0 ? (item.value / maxVal) * 100 : 0;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
      <span style={{ width: 120, fontSize: 12, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {item.name}
      </span>
      <div style={{ flex: 1, background: 'var(--bg-tertiary)', borderRadius: 2, height: 18, overflow: 'hidden' }}>
        <div
          style={{
            width: `${widthPct}%`,
            height: '100%',
            background: item.color,
            borderRadius: 2,
            transition: 'width 0.5s ease',
            minWidth: item.value > 0 ? 4 : 0,
          }}
        />
      </div>
      <span style={{ width: 50, textAlign: 'right', fontSize: 12, color: 'var(--text-primary)', fontWeight: 600 }}>
        {item.value.toLocaleString('ru-RU')}
      </span>
    </div>
  );
}

// --- Main Screen ---
export function AnalyticsScreen() {
  const [timeRange, setTimeRange] = useState('7d');

  const isMonthly = timeRange === '30d' || timeRange === '90d' || timeRange === '1y';

  // Metric cards data
  const metrics: MetricCard[] = [
    {
      id: 'dau',
      label: 'DAU (активных сегодня)',
      value: '12,345',
      trend: '+8.2%',
      trendUp: true,
      color: 'var(--accent)',
      chartData: generateWeeklyData(10800, 200),
      chartColor: 'var(--accent)',
    },
    {
      id: 'mau',
      label: 'MAU (за месяц)',
      value: '45,678',
      trend: '+12.5%',
      trendUp: true,
      color: 'var(--info)',
      chartData: isMonthly ? generateMonthlyData(35000, 800) : generateWeeklyData(42000, 600),
      chartColor: 'var(--info)',
    },
    {
      id: 'messages',
      label: 'Сообщений/день',
      value: '45,678',
      trend: '+5.3%',
      trendUp: true,
      color: 'var(--warning)',
      chartData: generateWeeklyData(38000, 1000),
      chartColor: 'var(--warning)',
    },
    {
      id: 'new-users',
      label: 'Новые пользователи',
      value: '892',
      trend: '+15.7%',
      trendUp: true,
      color: '#a855f7',
      chartData: generateWeeklyData(700, 30),
      chartColor: '#a855f7',
    },
    {
      id: 'retention',
      label: 'Retention D7',
      value: '42.3%',
      trend: '-1.2%',
      trendUp: false,
      color: '#ef4444',
      chartData: generateWeeklyData(45, -0.5),
      chartColor: '#ef4444',
    },
    {
      id: 'avg-session',
      label: 'Средняя сессия',
      value: '8.4 мин',
      trend: '+0.6 мин',
      trendUp: true,
      color: '#ec4899',
      chartData: generateWeeklyData(7, 0.2),
      chartColor: '#ec4899',
    },
  ];

  // Top channels
  const topChannels: TopItem[] = [
    { name: 'Balloo News', value: 15234, color: 'var(--accent)' },
    { name: 'Техподдержка', value: 12300, color: 'var(--info)' },
    { name: 'Флудилка', value: 8900, color: 'var(--warning)' },
    { name: 'Важное', value: 5400, color: '#a855f7' },
    { name: 'Общий чат', value: 3200, color: '#ec4899' },
  ];

  // Top users by messages
  const topUsers: TopItem[] = [
    { name: 'ivan@balloo.su', value: 1842, color: 'var(--accent)' },
    { name: 'anna@balloo.su', value: 1560, color: 'var(--info)' },
    { name: 'petr@balloo.su', value: 1230, color: 'var(--warning)' },
    { name: 'maria@balloo.su', value: 980, color: '#a855f7' },
    { name: 'alex@balloo.su', value: 756, color: '#ec4899' },
  ];

  const maxChannelVal = Math.max(...topChannels.map((c) => c.value));
  const maxUserVal = Math.max(...topUsers.map((u) => u.value));

  return (
    <div className="page-container fade-in">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
          Аналитика и метрики
        </h1>

        {/* Time range selector */}
        <div style={{ display: 'flex', gap: 4, background: 'var(--bg-secondary)', borderRadius: 6, padding: 3 }}>
          {TIME_RANGES.map((tr) => (
            <button
              key={tr.key}
              onClick={() => setTimeRange(tr.key)}
              style={{
                padding: '6px 16px',
                border: 'none',
                borderRadius: 4,
                background: timeRange === tr.key ? 'var(--accent)' : 'transparent',
                color: timeRange === tr.key ? '#fff' : 'var(--text-secondary)',
                fontSize: 12,
                fontWeight: 500,
                cursor: 'pointer',
                fontFamily: 'var(--font-primary)',
                transition: 'all 0.15s ease',
              }}
            >
              {tr.label}
            </button>
          ))}
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16, marginBottom: 24 }}>
        {metrics.map((m) => (
          <div key={m.id} className="card" style={{ padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>{m.label}</span>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: m.trendUp ? 'var(--accent)' : 'var(--danger)',
                  background: m.trendUp ? 'rgba(45,184,77,0.12)' : 'rgba(239,68,68,0.12)',
                  padding: '2px 8px',
                  borderRadius: 4,
                }}
              >
                {m.trendUp ? '↑' : '↓'} {m.trend}
              </span>
            </div>
            <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 12 }}>
              {m.value}
            </div>
            <MiniChart data={m.chartData} color={m.chartColor} />
          </div>
        ))}
      </div>

      {/* Main Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
        <div className="card" style={{ padding: 20 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 16 }}>
            {isMonthly ? 'Новые пользователи (по месяцам)' : 'Новые пользователи (за неделю)'}
          </h3>
          <BarChart
            data={isMonthly ? generateMonthlyData(3500, 200) : generateWeeklyData(120, 25)}
            color="var(--accent)"
          />
        </div>
        <div className="card" style={{ padding: 20 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 16 }}>
            Сообщения (за период)
          </h3>
          <BarChart
            data={isMonthly ? generateMonthlyData(800000, 50000) : generateWeeklyData(38000, 1200)}
            color="var(--info)"
          />
        </div>
      </div>

      {/* Retention Chart */}
      <div className="card" style={{ padding: 20, marginBottom: 24 }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 16 }}>
          Retention Cohort (возврат пользователей)
        </h3>
        <BarChart
          data={[
            { label: 'День 1', value: 100 },
            { label: 'День 2', value: 72 },
            { label: 'День 3', value: 58 },
            { label: 'День 4', value: 48 },
            { label: 'День 5', value: 44 },
            { label: 'День 6', value: 43 },
            { label: 'День 7', value: 42 },
          ]}
          color="#a855f7"
          height={120}
        />
      </div>

      {/* Top Channels + Top Users */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div className="card" style={{ padding: 20 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 16 }}>
            Топ каналов (по сообщениям)
          </h3>
          {topChannels.map((ch) => (
            <HorizontalBar key={ch.name} item={ch} maxVal={maxChannelVal} index={topChannels.indexOf(ch)} />
          ))}
        </div>
        <div className="card" style={{ padding: 20 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 16 }}>
            Топ пользователей (по сообщениям)
          </h3>
          {topUsers.map((u) => (
            <HorizontalBar key={u.name} item={u} maxVal={maxUserVal} index={topUsers.indexOf(u)} />
          ))}
        </div>
      </div>
    </div>
  );
}
