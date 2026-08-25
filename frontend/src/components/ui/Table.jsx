import clsx from 'clsx';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useI18n } from '../../i18n/index.jsx';
import { Button } from './Button.jsx';
import { Skeleton } from './Misc.jsx';

/**
 * Thin table primitives. Every list screen composes these so row height,
 * divider colour and header treatment stay identical across the app.
 */
export const Table = ({ children, className }) => (
  <div className="scroll-x">
    <table className={clsx('w-full min-w-[640px] border-collapse text-sm', className)}>{children}</table>
  </div>
);

export const THead = ({ children }) => (
  <thead className="table-head">
    <tr>{children}</tr>
  </thead>
);

export const TH = ({ children, className, align = 'start' }) => (
  <th
    className={clsx(
      'border-b border-line px-4 py-3 font-semibold',
      align === 'end' ? 'text-end' : align === 'center' ? 'text-center' : 'text-start',
      className,
    )}
  >
    {children}
  </th>
);

export const TBody = ({ children }) => <tbody>{children}</tbody>;

export const TR = ({ children, className, onClick }) => (
  <tr
    onClick={onClick}
    className={clsx(
      'border-b border-line/70 last:border-0',
      onClick && 'cursor-pointer transition hover:bg-slate-50/80',
      className,
    )}
  >
    {children}
  </tr>
);

export const TD = ({ children, className, align = 'start', colSpan }) => (
  <td
    colSpan={colSpan}
    className={clsx(
      'px-4 py-3.5 text-slate-600',
      align === 'end' ? 'text-end' : align === 'center' ? 'text-center' : 'text-start',
      className,
    )}
  >
    {children}
  </td>
);

export const TableSkeleton = ({ rows = 5, cols = 5 }) => (
  <div className="space-y-2 p-4">
    {Array.from({ length: rows }).map((_, r) => (
      <div key={r} className="flex gap-4">
        {Array.from({ length: cols }).map((__, c) => (
          <Skeleton key={c} className={clsx('h-5', c === 0 ? 'w-32' : 'flex-1')} />
        ))}
      </div>
    ))}
  </div>
);

export const Pagination = ({ meta, onChange, className }) => {
  const { t } = useI18n();
  if (!meta || meta.pages <= 1) return null;

  return (
    <div className={clsx('flex flex-wrap items-center justify-between gap-3 px-5 py-3.5', className)}>
      <p className="text-xs text-slate-500">
        {t('common.page')} {meta.page} {t('common.of')} {meta.pages} · {t('common.results', { n: meta.total })}
      </p>
      <div className="flex items-center gap-1.5">
        <Button
          size="sm"
          variant="soft"
          icon={ChevronLeft}
          disabled={!meta.hasPrev}
          onClick={() => onChange(meta.page - 1)}
          className="rtl-flip"
          aria-label="Previous page"
        />
        {Array.from({ length: Math.min(5, meta.pages) }).map((_, i) => {
          const start = Math.max(1, Math.min(meta.page - 2, meta.pages - 4));
          const page = start + i;
          if (page > meta.pages) return null;
          return (
            <button
              key={page}
              type="button"
              onClick={() => onChange(page)}
              className={clsx(
                'h-9 min-w-9 rounded-lg px-2.5 text-[13px] font-semibold transition',
                page === meta.page
                  ? 'bg-navy-900 text-white'
                  : 'border border-line bg-white text-slate-600 hover:bg-slate-50',
              )}
            >
              {page}
            </button>
          );
        })}
        <Button
          size="sm"
          variant="soft"
          icon={ChevronRight}
          disabled={!meta.hasNext}
          onClick={() => onChange(meta.page + 1)}
          className="rtl-flip"
          aria-label="Next page"
        />
      </div>
    </div>
  );
};
