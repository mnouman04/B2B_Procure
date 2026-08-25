import clsx from 'clsx';
import { Check } from 'lucide-react';
import { useI18n } from '../../i18n/index.jsx';

/** The order lifecycle from the brief: Approved → Processing → Shipped → Delivered. */
const FLOW = ['issued', 'approved', 'processing', 'shipped', 'delivered', 'completed'];

export const OrderProgress = ({ status, compact = false, className }) => {
  const { t } = useI18n();

  if (status === 'cancelled') {
    return (
      <div className={clsx('h-1.5 rounded-full bg-danger/25', className)}>
        <div className="h-full w-full rounded-full bg-danger/60" />
      </div>
    );
  }

  const index = FLOW.indexOf(status);
  const percent = index < 0 ? 0 : (index / (FLOW.length - 1)) * 100;

  if (compact) {
    return (
      <div className={clsx('h-1.5 w-full overflow-hidden rounded-full bg-line', className)}>
        <div
          className="h-full rounded-full bg-success transition-all duration-500"
          style={{ width: `${percent}%` }}
        />
      </div>
    );
  }

  return (
    <ol className={clsx('flex items-start', className)}>
      {FLOW.map((step, i) => {
        const done = i <= index;
        return (
          <li key={step} className="flex flex-1 items-start last:flex-none">
            <div className="flex flex-col items-center gap-2">
              <span
                className={clsx(
                  'grid h-8 w-8 place-items-center rounded-full border-2 text-[11px] font-bold transition',
                  done ? 'border-success bg-success text-white' : 'border-line bg-white text-slate-300',
                )}
              >
                {done ? <Check size={14} /> : i + 1}
              </span>
              <span className={clsx('text-center text-[11px]', done ? 'font-semibold text-ink' : 'text-slate-400')}>
                {t(`status.${step}`)}
              </span>
            </div>
            {i < FLOW.length - 1 && (
              <span className={clsx('mt-4 h-0.5 flex-1', i < index ? 'bg-success' : 'bg-line')} />
            )}
          </li>
        );
      })}
    </ol>
  );
};
