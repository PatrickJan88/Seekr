import React, { useState } from 'react';
import { HeadcountPoint } from '../types';

interface HeadcountTrendChartProps {
  data: HeadcountPoint[];
  currentHeadcount: number;
  monthChangePct: number;
  oneYearGrowthPct: number;
  twoYearGrowthPct: number;
  
}

export const HeadcountTrendChart: React.FC<HeadcountTrendChartProps> = ({
  data = [],
  currentHeadcount,
  monthChangePct,
  oneYearGrowthPct,
  twoYearGrowthPct,
  
}) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(data.length - 1);

  if (!data || data.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center text-sm text-[#777c86]">
        {'No headcount trend data available'}
      </div>
    );
  }

  // Calculate coordinates with comfortable top padding to prevent tooltip clipping
  const width = 640;
  const height = 200;
  const paddingLeft = 45;
  const paddingRight = 35;
  const paddingTop = 42;
  const paddingBottom = 32;

  const chartW = width - paddingLeft - paddingRight;
  const chartH = height - paddingTop - paddingBottom;

  const maxVal = Math.max(...data.map(d => d.headcount), 100);
  const yMax = Math.ceil(maxVal / 25) * 25; // Round to nearest 25 (e.g. 100)

  const points = data.map((d, i) => {
    const x = paddingLeft + (i / Math.max(data.length - 1, 1)) * chartW;
    const y = paddingTop + chartH - (d.headcount / yMax) * chartH;
    return { x, y, ...d };
  });

  // SVG path generators
  const linePath = points.reduce((acc, p, i) => {
    if (i === 0) return `M ${p.x} ${p.y}`;
    // Smooth bezier curve
    const prev = points[i - 1];
    const cx = (prev.x + p.x) / 2;
    return `${acc} C ${cx} ${prev.y}, ${cx} ${p.y}, ${p.x} ${p.y}`;
  }, '');

  const areaPath = `${linePath} L ${points[points.length - 1].x} ${paddingTop + chartH} L ${points[0].x} ${paddingTop + chartH} Z`;

  const activePoint = hoveredIdx !== null && points[hoveredIdx] ? points[hoveredIdx] : points[points.length - 1];

  // Determine label indices for X axis (first, middle, last)
  const xLabels = [
    { label: data[0]?.date || 'Aug 2024', x: points[0]?.x || paddingLeft, anchor: 'start' },
    { label: data[Math.floor((data.length - 1) / 2)]?.date || 'Aug 2025', x: points[Math.floor((data.length - 1) / 2)]?.x || width / 2, anchor: 'middle' },
    { label: data[data.length - 1]?.date || 'Aug 2026', x: points[points.length - 1]?.x || width - paddingRight, anchor: 'end' }
  ];

  const xRatio = activePoint ? activePoint.x / width : 0.5;
  const tooltipTranslateX = xRatio > 0.78 ? '-85%' : xRatio < 0.22 ? '-15%' : '-50%';
  const arrowLeft = xRatio > 0.78 ? '85%' : xRatio < 0.22 ? '15%' : '50%';

  return (
    <div className="w-full flex flex-col">
      {/* Metric Callouts Header matching LinkedIn insights */}
      <div className="flex items-center justify-between pb-3 border-b border-[#efefef] mb-3">
        <div className="flex items-center gap-6">
          <div>
            <div className="text-xs text-[#777c86] font-medium">
              {'Total Headcount'}
            </div>
            <div className="text-xl font-bold text-[#121722] flex items-baseline gap-1.5 mt-0.5">
              {currentHeadcount}
              <span className={`text-xs font-semibold ${monthChangePct >= 0 ? 'text-blue-600' : 'text-rose-600'}`}>
                {monthChangePct >= 0 ? `▲ ${monthChangePct}%` : `▼ ${Math.abs(monthChangePct)}%`}
              </span>
            </div>
          </div>
          <div className="h-8 w-px bg-[#efefef]" />
          <div>
            <div className="text-xs text-[#777c86] font-medium">
              {'1-Year Growth'}
            </div>
            <div className="text-sm font-bold text-blue-600 mt-1">
              {oneYearGrowthPct >= 0 ? `+${oneYearGrowthPct}%` : `${oneYearGrowthPct}%`}
            </div>
          </div>
          <div className="h-8 w-px bg-[#efefef]" />
          <div>
            <div className="text-xs text-[#777c86] font-medium">
              {'2-Year Growth'}
            </div>
            <div className="text-sm font-bold text-blue-600 mt-1">
              {twoYearGrowthPct >= 0 ? `+${twoYearGrowthPct}%` : `${twoYearGrowthPct}%`}
            </div>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-1.5 text-xs text-[#777c86] bg-[#faf9f7] px-2.5 py-1 rounded-md border border-[#efefef]">
          <span className="w-2 h-2 rounded-full bg-blue-600"></span>
          <span>{'LinkedIn Org Dynamics'}</span>
        </div>
      </div>

      {/* SVG Chart Container with visible overflow for tooltip */}
      <div className="relative w-full overflow-visible select-none pt-4 pb-1">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto overflow-visible"
          style={{ minHeight: '175px' }}
        >
          <defs>
            <linearGradient id="headcountAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2563eb" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#2563eb" stopOpacity="0.01" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[0, yMax / 2, yMax].map((val, idx) => {
            const y = paddingTop + chartH - (val / yMax) * chartH;
            return (
              <g key={idx}>
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={width - paddingRight}
                  y2={y}
                  stroke="#e5e7eb"
                  strokeWidth="1"
                />
                <text
                  x={paddingLeft - 8}
                  y={y + 4}
                  textAnchor="end"
                  fill="#9ca3af"
                  fontSize="11"
                  fontWeight="500"
                  fontFamily="system-ui, -apple-system, sans-serif"
                >
                  {Math.round(val)}
                </text>
              </g>
            );
          })}

          {/* Area fill */}
          <path d={areaPath} fill="url(#headcountAreaGrad)" />

          {/* Line stroke */}
          <path
            d={linePath}
            fill="none"
            stroke="#2563eb"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Data Points */}
          {points.map((p, idx) => {
            const isHovered = hoveredIdx === idx;
            return (
              <g key={idx} className="cursor-pointer">
                {/* Active glow on hover */}
                {isHovered && (
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r="9"
                    fill="#2563eb"
                    fillOpacity="0.25"
                  />
                )}
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={isHovered ? "5.5" : "3.5"}
                  fill="#2563eb"
                  stroke="#ffffff"
                  strokeWidth={isHovered ? "2.5" : "1.5"}
                  onMouseEnter={() => setHoveredIdx(idx)}
                />
                {/* Invisible larger hover hit area */}
                <rect
                  x={p.x - 14}
                  y={paddingTop - 10}
                  width="28"
                  height={chartH + 20}
                  fill="transparent"
                  onMouseEnter={() => setHoveredIdx(idx)}
                />
              </g>
            );
          })}

          {/* X Axis Labels */}
          {xLabels.map((lbl, idx) => (
            <text
              key={idx}
              x={lbl.x}
              y={height - 6}
              textAnchor={lbl.anchor as any}
              fill="#6b7280"
              fontSize="11"
              fontWeight="500"
              fontFamily="system-ui, -apple-system, sans-serif"
            >
              {lbl.label}
            </text>
          ))}
        </svg>

        {/* Floating Tooltip matching user screenshot with unclipped boundary */}
        {activePoint && (
          <div
            className="absolute pointer-events-none transition-all duration-150 z-30"
            style={{
              left: `${(activePoint.x / width) * 100}%`,
              top: `${(activePoint.y / height) * 100}%`,
              transform: `translate(${tooltipTranslateX}, -100%) translateY(-14px)`
            }}
          >
            <div className="relative bg-white border border-[#e5e7eb] rounded-xl shadow-xl px-3.5 py-2.5 min-w-[170px] whitespace-nowrap">
              <div className="flex items-center gap-2 text-xs font-bold text-[#111827]">
                <span className="w-2.5 h-2.5 rounded-full bg-[#2563eb] shrink-0" />
                <span>{`Employee headcount · ${activePoint.headcount}`}</span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-blue-600 mt-1 pl-4.5">
                <span>▲</span>
                <span>{monthChangePct >= 0 ? `+${monthChangePct}%` : `${monthChangePct}%`} {'last month'}</span>
                <span className="text-[#9ca3af] font-normal ml-1">({activePoint.date})</span>
              </div>

              {/* Arrow pointer downward */}
              <div
                className="absolute -bottom-1.5 w-3 h-3 bg-white border-r border-b border-[#e5e7eb]"
                style={{
                  left: arrowLeft,
                  transform: 'translateX(-50%) rotate(45deg)'
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
