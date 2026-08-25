import { NavLink, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import clsx from 'clsx';
import { LogOut } from 'lucide-react';
import { useI18n } from '../../i18n/index.jsx';
import { selectUser } from '../../store/authSlice.js';
import { NAV, roleLabelKey } from '../../app/routes.js';
import { Logo } from './Logo.jsx';

/**
 * The dark navy rail from the dashboard mockups: role caption, icon + label
 * rows, a gold count chip on the rows that carry one, and a rounded
 * highlight on the active item.
 */
export const Sidebar = ({ open, onNavigate, badges = {}, onSignOut }) => {
  const { t } = useI18n();
  const user = useSelector(selectUser);
  const items = NAV[user?.role] ?? [];

  return (
    <aside
      className={clsx(
        'fixed inset-y-0 z-40 flex w-[248px] flex-col bg-navy-950 transition-transform duration-200',
        'start-0 lg:translate-x-0 rtl:lg:translate-x-0',
        open ? 'translate-x-0' : '-translate-x-full rtl:translate-x-full',
      )}
    >
      <div className="flex h-[68px] shrink-0 items-center border-b border-white/[0.07] px-5">
        <Link to="/" onClick={onNavigate}>
          <Logo theme="dark" showTagline={false} size="sm" />
        </Link>
      </div>

      <p className="px-5 pb-2 pt-5 text-[10px] font-bold tracking-[0.12em] text-white/40">
        {t(roleLabelKey(user?.role))}
      </p>

      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 pb-4">
        {items.map((item) => {
          const count = badges[item.badge];
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={onNavigate}
              className={({ isActive }) =>
                clsx(
                  'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13.5px] font-medium transition',
                  isActive
                    ? 'bg-white/[0.09] text-white'
                    : 'text-white/65 hover:bg-white/[0.05] hover:text-white',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon size={17} className={clsx('shrink-0', isActive ? 'text-gold-400' : 'text-white/50')} />
                  <span className="flex-1 truncate">{t(item.labelKey)}</span>
                  {count > 0 && (
                    <span className="grid h-5 min-w-5 place-items-center rounded-md bg-gold-400 px-1 text-[11px] font-bold text-navy-900">
                      {count > 99 ? '99+' : count}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      <button
        type="button"
        onClick={onSignOut}
        className="m-3 flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13.5px] font-medium text-white/65 transition hover:bg-white/[0.05] hover:text-white"
      >
        <LogOut size={17} className="shrink-0 text-white/50 rtl-flip" />
        {t('nav.logout')}
      </button>
    </aside>
  );
};
