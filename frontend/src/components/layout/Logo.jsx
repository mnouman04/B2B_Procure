import clsx from 'clsx';
import { useI18n } from '../../i18n/index.jsx';

/** The hexagon mark + wordmark used in the header, sidebar and footer. */
export const Logo = ({ theme = 'dark', showTagline = true, size = 'md', className }) => {
  const { t } = useI18n();
  const dim = size === 'sm' ? 26 : size === 'lg' ? 40 : 32;

  return (
    <span className={clsx('inline-flex items-center gap-2.5', className)}>
      <svg width={dim} height={dim} viewBox="0 0 32 32" className="shrink-0" aria-hidden>
        <rect width="32" height="32" rx="7" fill={theme === 'dark' ? '#0B1B3A' : '#FFFFFF'} />
        <path
          d="M16 6.5 24.5 11v10L16 25.5 7.5 21V11L16 6.5Z"
          fill="none"
          stroke="#E9C46A"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <path d="M16 12.5 20 15v4l-4 2.5L12 19v-4l4-2.5Z" fill="#E9C46A" />
      </svg>

      <span className="leading-none">
        <span
          className={clsx(
            'block font-extrabold tracking-tight',
            size === 'sm' ? 'text-base' : size === 'lg' ? 'text-2xl' : 'text-xl',
            theme === 'dark' ? 'text-white' : 'text-navy-900',
          )}
        >
          {t('brand.name')}
        </span>
        {showTagline && (
          <span
            className={clsx(
              'mt-0.5 block text-[9px] font-medium tracking-wide',
              theme === 'dark' ? 'text-gold-300/80' : 'text-slate-500',
            )}
          >
            {t('brand.tagline')}
          </span>
        )}
      </span>
    </span>
  );
};
