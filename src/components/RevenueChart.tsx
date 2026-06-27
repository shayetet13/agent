interface BarData {
  label: string;
  value: number;
}

function shortBaht(n: number): string {
  if (n === 0) return "0";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}ล.`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}พ.`;
  return n.toFixed(0);
}

export function BarChart({ data, title, color = "#6366f1" }: { data: BarData[]; title: string; color?: string }) {
  if (data.length === 0) return null;

  const max = Math.max(...data.map((d) => d.value), 1);
  const W = 560;
  const H = 160;
  const PL = 52; // left padding (y-axis)
  const PR = 8;
  const PT = 12;
  const PB = 34; // bottom padding (x-axis)
  const chartW = W - PL - PR;
  const chartH = H - PT - PB;
  const slotW = chartW / data.length;
  const barW = Math.min(40, slotW - 8);

  return (
    <div className="bg-surface border border-border rounded-xl p-4 flex flex-col gap-3">
      <span className="font-semibold text-sm text-foreground">{title}</span>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" aria-hidden="true">
        {/* grid lines + y labels */}
        {[0, 0.25, 0.5, 0.75, 1].map((t) => {
          const y = PT + chartH * (1 - t);
          return (
            <g key={t}>
              <line x1={PL} y1={y} x2={W - PR} y2={y} stroke="#e5e7eb" strokeWidth={t === 0 ? 1 : 0.5} />
              <text x={PL - 4} y={y + 3.5} textAnchor="end" fontSize={9} fill="#9ca3af">
                {shortBaht(max * t)}
              </text>
            </g>
          );
        })}
        {/* bars */}
        {data.map((d, i) => {
          const bH = Math.max(d.value > 0 ? 2 : 0, (d.value / max) * chartH);
          const x = PL + i * slotW + (slotW - barW) / 2;
          const y = PT + chartH - bH;
          return (
            <g key={i}>
              <rect x={x} y={y} width={barW} height={bH} fill={color} rx={3} opacity={d.value === 0 ? 0.15 : 0.85} />
              <text x={x + barW / 2} y={H - PB + 14} textAnchor="middle" fontSize={10} fill="#6b7280">
                {d.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
