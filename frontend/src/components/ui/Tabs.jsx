import clsx from 'clsx';

/**
 * Underlined tab strip — the pattern used on the Supplier Profile
 * ("About · Products & Services · Certifications · Projects · Reviews").
 */
export const Tabs = ({ tabs, value, onChange, className }) => (
  <div className={clsx('border-b border-line', className)}>
    <div className="scroll-x -mb-px flex gap-6">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          type="button"
          onClick={() => onChange(tab.key)}
          className={clsx(
            'whitespace-nowrap border-b-2 pb-3 pt-1 text-sm transition',
            value === tab.key
              ? 'border-navy-900 font-bold text-ink'
              : 'border-transparent font-medium text-slate-500 hover:text-ink',
          )}
        >
          {tab.label}
          {tab.count != null && (
            <span className="ms-1.5 rounded-full bg-slate-100 px-1.5 py-0.5 text-[11px] text-slate-500">
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  </div>
);

/** Segmented pill control used for list filters. */
export const SegmentedControl = ({ options, value, onChange, className }) => (
  <div className={clsx('inline-flex rounded-lg border border-line bg-white p-1', className)}>
    {options.map((opt) => (
      <button
        key={opt.value}
        type="button"
        onClick={() => onChange(opt.value)}
        className={clsx(
          'rounded-md px-3 py-1.5 text-[13px] font-semibold transition',
          value === opt.value ? 'bg-navy-900 text-white' : 'text-slate-600 hover:bg-slate-50',
        )}
      >
        {opt.label}
      </button>
    ))}
  </div>
);
