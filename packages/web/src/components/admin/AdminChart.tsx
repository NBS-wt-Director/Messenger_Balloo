// AdminChart — простой SVG-график для админ-дашборда
// Без внешних зависимостей (recharts/chart.js)

import React from 'react';

interface DataPoint {
  label: string;
  value: number;
}

interface AdminChartProps {
  title: string;
  data: DataPoint[];
  type: 'line' | 'bar';
  height?: number;
  color?: string;
  style?: React.CSSProperties;
}

function LineChart({
  data,
  width,
  height,
  color,
}: {
  data: DataPoint[];
  width: number;
  height: number;
  color: string;
}) {
  if (data.length === 0) return null;

  const maxVal = Math.max(...data.map((d) => d.value));
  const padding = { top: 20, right: 20, bottom: 30, left: 40 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const points = data.map((d, i) => {
    const x = padding.left + (i / Math.max(data.length - 1, 1)) * chartW;
    const y = padding.top + chartH - (d.value / maxVal) * chartH;
    return `${x},${y}`;
  });

  const pathD = points.map((p, i) => (i === 0 ? `M${p}` : `L${p}`)).join(' ');

  // Gradient area
  const areaD = `${pathD} L${padding.left + chartW},${padding.top + chartH} L${padding.left},${padding.top + chartH} Z`;

  // Y-axis labels
  const yLabels = [0, Math.round(maxVal / 2), maxVal];

  return (
    <svg width={width} height={height} style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id={`gradient-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.2" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>

      {/* Grid lines */}
      {yLabels.map((val, i) => {
        const y = padding.top + chartH - (val / maxVal) * chartH;
        return (
          <g key={i}>
            <line
              x1={padding.left}
              y1={y}
              x2={padding.left + chartW}
              y2={y}
              stroke="var(--border-color)"
              strokeWidth={1}
              strokeDasharray="4 4"
            />
            <text
              x={padding.left - 8}
              y={y + 4}
              textAnchor="end"
              fill="var(--text-muted)"
              fontSize={11}
            >
              {val.toLocaleString()}
            </text>
          </g>
        );
      })}

      {/* Area fill */}
      <path d={areaD} fill={`url(#gradient-${color.replace('#', '')})`} />

      {/* Line */}
      <path d={pathD} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" />

      {/* Dots */}
      {data.map((d, i) => {
        const x = padding.left + (i / Math.max(data.length - 1, 1)) * chartW;
        const y = padding.top + chartH - (d.value / maxVal) * chartH;
        return (
          <g key={i}>
            <circle cx={x} cy={y} r={4} fill={color} stroke="var(--bg-primary)" strokeWidth={2} />
            <text
              x={x}
              y={padding.top + chartH + 16}
              textAnchor="middle"
              fill="var(--text-muted)"
              fontSize={10}
            >
              {d.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function BarChart({
  data,
  width,
  height,
  color,
}: {
  data: DataPoint[];
  width: number;
  height: number;
  color: string;
}) {
  if (data.length === 0) return null;

  const maxVal = Math.max(...data.map((d) => d.value));
  const padding = { top: 20, right: 20, bottom: 30, left: 40 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const barWidth = Math.min(chartW / data.length * 0.6, 40);
  const gap = chartW / data.length;

  // Y-axis labels
  const yLabels = [0, Math.round(maxVal / 2), maxVal];

  return (
    <svg width={width} height={height} style={{ overflow: 'visible' }}>
      {/* Grid lines */}
      {yLabels.map((val, i) => {
        const y = padding.top + chartH - (val / maxVal) * chartH;
        return (
          <g key={i}>
            <line
              x1={padding.left}
              y1={y}
              x2={padding.left + chartW}
              y2={y}
              stroke="var(--border-color)"
              strokeWidth={1}
              strokeDasharray="4 4"
            />
            <text
              x={padding.left - 8}
              y={y + 4}
              textAnchor="end"
              fill="var(--text-muted)"
              fontSize={11}
            >
              {val.toLocaleString()}
            </text>
          </g>
        );
      })}

      {/* Bars */}
      {data.map((d, i) => {
        const barH = (d.value / maxVal) * chartH;
        const x = padding.left + i * gap + (gap - barWidth) / 2;
        const y = padding.top + chartH - barH;
        return (
          <g key={i}>
            <rect
              x={x}
              y={y}
              width={barWidth}
              height={barH}
              fill={color}
              rx={2}
              opacity={0.8}
            />
            <text
              x={x + barWidth / 2}
              y={padding.top + chartH + 16}
              textAnchor="middle"
              fill="var(--text-muted)"
              fontSize={10}
            >
              {d.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export function AdminChart({
  title,
  data,
  type,
  height = 200,
  color = 'var(--accent)',
  style,
}: AdminChartProps) {
  return (
    <div
      className="card"
      style={{
        padding: 20,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        ...style,
      }}
    >
      <h3
        style={{
          fontSize: 14,
          fontWeight: 600,
          color: 'var(--text-primary)',
        }}
      >
        {title}
      </h3>
      <div style={{ width: '100%', height }}>
        {type === 'line' ? (
          <LineChart data={data} width={600} height={height} color={color} />
        ) : (
          <BarChart data={data} width={600} height={height} color={color} />
        )}
      </div>
    </div>
  );
}