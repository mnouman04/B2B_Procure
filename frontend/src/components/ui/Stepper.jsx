import clsx from 'clsx';
import { Check } from 'lucide-react';

/**
 * The numbered wizard rail from the "Create New RFQ" screen:
 * a gold filled circle for the active step, a check for completed steps
 * and hairlines connecting them.
 */
export const Stepper = ({ steps, current, onStepClick, className }) => (
  <ol className={clsx('flex items-start', className)}>
    {steps.map((step, index) => {
      const state = index < current ? 'done' : index === current ? 'active' : 'todo';
      const clickable = onStepClick && index <= current;

      return (
        <li key={step.key} className="flex flex-1 items-start last:flex-none">
          <div className="flex flex-col items-center gap-2">
            <button
              type="button"
              disabled={!clickable}
              onClick={() => clickable && onStepClick(index)}
              className={clsx(
                'grid h-9 w-9 place-items-center rounded-full border-2 text-[13px] font-bold transition',
                state === 'active' && 'border-gold-500 bg-gold-400 text-navy-900',
                state === 'done' && 'border-success bg-success text-white',
                state === 'todo' && 'border-line bg-white text-slate-400',
                clickable && 'cursor-pointer',
              )}
            >
              {state === 'done' ? <Check size={16} /> : index + 1}
            </button>
            <span
              className={clsx(
                'max-w-[9rem] text-center text-[12px] leading-tight',
                state === 'todo' ? 'text-slate-400' : 'font-semibold text-ink',
              )}
            >
              {step.label}
            </span>
          </div>

          {index < steps.length - 1 && (
            <span
              className={clsx(
                'mt-[18px] h-0.5 flex-1',
                index < current ? 'bg-success' : 'bg-line',
              )}
            />
          )}
        </li>
      );
    })}
  </ol>
);
