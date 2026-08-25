import {
  PieChart, Pie, Cell, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, LineChart, Line,
} from 'recharts';
import { useI18n } from '../../i18n/index.jsx';
import { formatMoney, CHART_COLORS } from '../../utils/format.js';

const tooltipStyle = {
  borderRadius: 10,
  border: '1px solid #E6EAF1',
  boxShadow: '0 8px 24px rgba(15,23,42,.10)',
  fontSize: 12,
  padding: '8px 12px',
};

/**
 * The donut with a centred total from the "Spend Overview (YTD)" card,
 * paired with a legend that shows each slice's share.
 */
export const SpendDonut = ({ data = [], total = 0, centreLabel, centreCaption }) => {
  const { t } = useI18n();
  const slices = data.length ? data : [{ name: t('common.noData'), value: 1, muted: true }];

  return (
    <div className="flex flex-wrap items-center gap-6">
      <div className="relative h-[190px] w-[190px] shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={slices}
              dataKey="value"
              nameKey="name"
              innerRadius={62}
              outerRadius={90}
              paddingAngle={1}
              stroke="none"
            >
              {slices.map((entry, i) => (
                <Cell key={entry.name} fill={entry.muted ? '#E6EAF1' : CHART_COLORS[i % CHART_COLORS.length]} />
              ))}
            </Pie>
            {!slices[0].muted && (
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(value) => [`${formatMoney(value, { decimals: 0 })} ${t('common.currency')}`, '']}
              />
            )}
          </PieChart>
        </ResponsiveContainer>

        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[11px] font-medium text-slate-400">{t('common.currency')}</span>
          <span className="text-xl font-extrabold tracking-tight text-ink">
            {centreLabel ?? formatMoney(total, { compact: true, decimals: 2 })}
          </span>
          <span className="text-[10px] text-slate-400">{centreCaption ?? t('dashboard.totalSpend')}</span>
        </div>
      </div>

      <ul className="min-w-[160px] flex-1 space-y-2.5">
        {data.map((entry, i) => (
          <li key={entry.name} className="flex items-center gap-2.5 text-[13px]">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ background: CHART_COLORS[i % CHART_COLORS.length] }}
            />
            <span className="flex-1 truncate text-slate-600">{entry.name}</span>
            <span className="font-semibold text-slate-500">{entry.share}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

/** Status donut used on the supplier dashboard ("Quote Performance"). */
export const StatusDonut = ({ data = [], total = 0, caption }) => {
  const slices = data.filter((d) => d.value > 0);
  const display = slices.length ? slices : [{ name: '—', value: 1, muted: true }];

  return (
    <div className="flex flex-wrap items-center gap-6">
      <div className="relative h-[170px] w-[170px] shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={display} dataKey="value" innerRadius={55} outerRadius={82} paddingAngle={2} stroke="none">
              {display.map((entry, i) => (
                <Cell key={entry.name} fill={entry.muted ? '#E6EAF1' : CHART_COLORS[i % CHART_COLORS.length]} />
              ))}
            </Pie>
            {!display[0].muted && <Tooltip contentStyle={tooltipStyle} />}
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-extrabold text-ink">{total}</span>
          <span className="text-[11px] text-slate-400">{caption}</span>
        </div>
      </div>

      <ul className="min-w-[150px] flex-1 space-y-2.5">
        {data.map((entry, i) => (
          <li key={entry.name} className="flex items-center gap-2.5 text-[13px]">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ background: CHART_COLORS[i % CHART_COLORS.length] }}
            />
            <span className="flex-1 truncate text-slate-600">{entry.name}</span>
            <span className="font-semibold text-ink">{entry.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export const SpendBars = ({ data = [], dataKey = 'spend', height = 260 }) => {
  const { t } = useI18n();
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#EEF1F6" vertical={false} />
        <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
        <YAxis
          tick={{ fontSize: 11, fill: '#94A3B8' }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => formatMoney(v, { compact: true, decimals: 0 })}
        />
        <Tooltip
          contentStyle={tooltipStyle}
          cursor={{ fill: '#F1F5F9' }}
          formatter={(value) => [`${formatMoney(value, { decimals: 0 })} ${t('common.currency')}`, '']}
        />
        <Bar dataKey={dataKey} fill="#1E3160" radius={[6, 6, 0, 0]} maxBarSize={38} />
      </BarChart>
    </ResponsiveContainer>
  );
};

export const TrendLine = ({ data = [], dataKey = 'orders', height = 200 }) => (
  <ResponsiveContainer width="100%" height={height}>
    <LineChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
      <CartesianGrid strokeDasharray="3 3" stroke="#EEF1F6" vertical={false} />
      <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
      <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} allowDecimals={false} />
      <Tooltip contentStyle={tooltipStyle} />
      <Line type="monotone" dataKey={dataKey} stroke="#DFAE4E" strokeWidth={2.5} dot={{ r: 3 }} />
    </LineChart>
  </ResponsiveContainer>
);
