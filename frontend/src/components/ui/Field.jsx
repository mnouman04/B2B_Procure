import clsx from 'clsx';
import { ChevronDown } from 'lucide-react';

const Label = ({ label, required, htmlFor }) =>
  label ? (
    <label className="field-label" htmlFor={htmlFor}>
      {label}
      {required && <span className="ms-0.5 text-danger">*</span>}
    </label>
  ) : null;

const Error = ({ error }) =>
  error ? <p className="mt-1 text-xs font-medium text-danger">{error}</p> : null;

export const Input = ({ label, required, error, hint, className, id, icon: Icon, ...props }) => (
  <div className={className}>
    <Label label={label} required={required} htmlFor={id} />
    <div className="relative">
      {Icon && (
        <Icon size={16} className="pointer-events-none absolute inset-y-0 my-auto start-3 text-slate-400" />
      )}
      <input
        id={id}
        className={clsx('field', Icon && 'ps-9', error && 'field-error')}
        {...props}
      />
    </div>
    {hint && !error && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
    <Error error={error} />
  </div>
);

export const Textarea = ({ label, required, error, className, id, rows = 3, ...props }) => (
  <div className={className}>
    <Label label={label} required={required} htmlFor={id} />
    <textarea id={id} rows={rows} className={clsx('field resize-y', error && 'field-error')} {...props} />
    <Error error={error} />
  </div>
);

export const Select = ({ label, required, error, className, id, children, placeholder, ...props }) => (
  <div className={className}>
    <Label label={label} required={required} htmlFor={id} />
    <div className="relative">
      <select
        id={id}
        className={clsx('field appearance-none pe-9', error && 'field-error', !props.value && 'text-slate-400')}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {children}
      </select>
      <ChevronDown
        size={16}
        className="pointer-events-none absolute inset-y-0 my-auto end-3 text-slate-400"
      />
    </div>
    <Error error={error} />
  </div>
);

export const Checkbox = ({ label, description, className, id, ...props }) => (
  <label className={clsx('flex cursor-pointer items-start gap-2.5', className)} htmlFor={id}>
    <input
      id={id}
      type="checkbox"
      className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 text-navy-900 focus:ring-navy-400"
      {...props}
    />
    <span>
      <span className="block text-sm font-medium text-ink">{label}</span>
      {description && <span className="block text-xs text-slate-500">{description}</span>}
    </span>
  </label>
);

export const Radio = ({ label, description, className, id, ...props }) => (
  <label
    className={clsx(
      'flex cursor-pointer items-start gap-2.5 rounded-lg border p-3 transition',
      props.checked ? 'border-navy-900 bg-navy-50/60' : 'border-line hover:border-navy-200',
      className,
    )}
    htmlFor={id}
  >
    <input
      id={id}
      type="radio"
      className="mt-0.5 h-4 w-4 shrink-0 border-slate-300 text-navy-900 focus:ring-navy-400"
      {...props}
    />
    <span>
      <span className="block text-sm font-medium text-ink">{label}</span>
      {description && <span className="block text-xs text-slate-500">{description}</span>}
    </span>
  </label>
);

/**
 * The compact labelled control seen on the Supplier Matching toolbar —
 * the label sits inside the box, above the value.
 */
export const InlineSelect = ({ label, className, children, ...props }) => (
  <div className={clsx('rounded-lg border border-line bg-white px-3.5 py-2', className)}>
    <p className="text-[11px] text-slate-400">{label}</p>
    <div className="relative">
      <select
        className="w-full appearance-none bg-transparent pe-5 text-sm font-medium text-ink focus:outline-none"
        {...props}
      >
        {children}
      </select>
      <ChevronDown size={14} className="pointer-events-none absolute inset-y-0 my-auto end-0 text-slate-400" />
    </div>
  </div>
);
