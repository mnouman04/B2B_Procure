import clsx from 'clsx';
import { Loader2 } from 'lucide-react';

const VARIANTS = {
  /** Navy pill — the primary action on every dark-on-light screen. */
  primary: 'bg-navy-900 text-white hover:bg-navy-800 active:bg-navy-950 disabled:bg-navy-300',
  /** Gold — the marketing call to action from the hero and header. */
  gold: 'bg-gold-400 text-navy-900 hover:bg-gold-500 active:bg-gold-600 disabled:bg-gold-200',
  outline: 'border border-navy-900 text-navy-900 bg-white hover:bg-navy-50 disabled:opacity-50',
  /** For use on the navy hero/header, where a white fill would disappear. */
  outlineLight: 'border border-white/45 bg-white/5 text-white hover:bg-white/15 disabled:opacity-50',
  soft: 'border border-line bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-50',
  ghost: 'text-slate-600 hover:bg-slate-100 hover:text-ink',
  danger: 'bg-danger text-white hover:bg-red-700 disabled:bg-red-300',
  success: 'bg-success text-white hover:bg-green-700 disabled:bg-green-300',
  link: 'text-info hover:text-blue-800 underline-offset-4 hover:underline px-0',
};

const SIZES = {
  xs: 'h-7 px-2.5 text-2xs gap-1 rounded-md',
  sm: 'h-9 px-3.5 text-[13px] gap-1.5 rounded-lg',
  md: 'h-10 px-4 text-sm gap-2 rounded-lg',
  lg: 'h-12 px-6 text-[15px] gap-2 rounded-lg',
};

export const Button = ({
  as: Tag = 'button',
  variant = 'primary',
  size = 'md',
  loading = false,
  icon: Icon,
  iconEnd: IconEnd,
  className,
  children,
  disabled,
  ...props
}) => (
  <Tag
    className={clsx(
      'inline-flex select-none items-center justify-center font-semibold transition-colors',
      'disabled:cursor-not-allowed',
      VARIANTS[variant],
      SIZES[size],
      className,
    )}
    disabled={Tag === 'button' ? disabled || loading : undefined}
    {...props}
  >
    {loading ? (
      <Loader2 size={16} className="animate-spin" />
    ) : (
      Icon && <Icon size={size === 'xs' ? 13 : 16} className="shrink-0" />
    )}
    {children}
    {IconEnd && !loading && <IconEnd size={16} className="shrink-0 rtl-flip" />}
  </Tag>
);
