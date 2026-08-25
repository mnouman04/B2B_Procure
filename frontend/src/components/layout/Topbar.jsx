import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Bell, ChevronDown, Globe, Menu, CheckCheck } from 'lucide-react';
import clsx from 'clsx';
import { useI18n } from '../../i18n/index.jsx';
import { selectUser, logout } from '../../store/authSlice.js';
import {
  fetchNotifications, markAllNotificationsRead, markNotificationRead,
  selectNotifications, selectUnreadCount,
} from '../../store/notificationSlice.js';
import { Logo } from './Logo.jsx';
import { Avatar, EmptyState } from '../ui/Misc.jsx';
import { Dropdown } from '../ui/Dropdown.jsx';
import { timeAgo } from '../../utils/format.js';

/**
 * The dark top bar from the dashboard mockups: logo + hamburger on the left,
 * a bell with a red dot and the account chip with company name and job title
 * on the right.
 */
export const Topbar = ({ onToggleSidebar }) => {
  const { t, pick, toggleLocale } = useI18n();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector(selectUser);
  const notifications = useSelector(selectNotifications);
  const unread = useSelector(selectUnreadCount);

  useEffect(() => {
    dispatch(fetchNotifications());
    const id = setInterval(() => dispatch(fetchNotifications()), 60_000);
    return () => clearInterval(id);
  }, [dispatch]);

  const orgName = pick(user?.company) || pick(user?.supplier) || t('sidebar.admin');

  return (
    <header className="sticky top-0 z-30 flex h-[68px] items-center gap-3 border-b border-white/[0.07] bg-navy-950 px-4 sm:px-5">
      <button
        type="button"
        onClick={onToggleSidebar}
        className="rounded-lg p-2 text-white/70 transition hover:bg-white/10 hover:text-white lg:hidden"
        aria-label="Toggle navigation"
      >
        <Menu size={20} />
      </button>

      <Link to="/" className="lg:hidden">
        <Logo theme="dark" showTagline={false} size="sm" />
      </Link>

      <div className="ms-auto flex items-center gap-1.5">
        <button
          type="button"
          onClick={toggleLocale}
          className="hidden items-center gap-1.5 rounded-lg px-2.5 py-2 text-[13px] font-medium text-white/75 transition hover:bg-white/10 hover:text-white sm:inline-flex"
        >
          <Globe size={15} />
          {t('common.language')}
        </button>

        <Dropdown
          width="w-[350px]"
          trigger={({ toggle }) => (
            <button
              type="button"
              onClick={toggle}
              className="relative rounded-lg p-2.5 text-white/75 transition hover:bg-white/10 hover:text-white"
              aria-label={t('common.notifications')}
            >
              <Bell size={19} />
              {unread > 0 && (
                <span className="absolute end-2 top-2 grid h-4 min-w-4 place-items-center rounded-full bg-danger px-1 text-[9px] font-bold text-white">
                  {unread > 9 ? '9+' : unread}
                </span>
              )}
            </button>
          )}
        >
          {({ close }) => (
            <>
              <div className="flex items-center justify-between border-b border-line px-4 py-3">
                <p className="text-sm font-bold text-ink">{t('common.notifications')}</p>
                {unread > 0 && (
                  <button
                    type="button"
                    onClick={() => dispatch(markAllNotificationsRead())}
                    className="inline-flex items-center gap-1 text-[12px] font-semibold text-info hover:text-blue-800"
                  >
                    <CheckCheck size={13} />
                    {t('common.markAllRead')}
                  </button>
                )}
              </div>

              <div className="max-h-[380px] overflow-y-auto">
                {notifications.length === 0 ? (
                  <EmptyState icon={Bell} title={t('common.noNotifications')} className="py-10" />
                ) : (
                  notifications.map((n) => (
                    <Link
                      key={n._id}
                      to={n.link || '#'}
                      onClick={() => {
                        if (!n.read) dispatch(markNotificationRead(n._id));
                        close();
                      }}
                      className={clsx(
                        'flex gap-3 border-b border-line/70 px-4 py-3 transition last:border-0 hover:bg-slate-50',
                        !n.read && 'bg-info-soft/40',
                      )}
                    >
                      <span
                        className={clsx(
                          'mt-1.5 h-2 w-2 shrink-0 rounded-full',
                          n.read ? 'bg-slate-300' : 'bg-info',
                        )}
                      />
                      <span className="min-w-0">
                        <span className="block text-[13px] font-semibold leading-snug text-ink">{n.title}</span>
                        {n.body && <span className="mt-0.5 block text-xs leading-snug text-slate-500">{n.body}</span>}
                        <span className="mt-1 block text-[11px] text-slate-400">{timeAgo(n.createdAt, t)}</span>
                      </span>
                    </Link>
                  ))
                )}
              </div>
            </>
          )}
        </Dropdown>

        <Dropdown
          trigger={({ toggle }) => (
            <button
              type="button"
              onClick={toggle}
              className="flex items-center gap-2.5 rounded-lg py-1.5 pe-2 ps-1.5 transition hover:bg-white/10"
            >
              <Avatar name={user?.fullName} size={34} rounded="full" />
              <span className="hidden text-start sm:block">
                <span className="block max-w-[170px] truncate text-[13px] font-semibold leading-tight text-white">
                  {orgName}
                </span>
                <span className="block text-[11px] leading-tight text-white/60">{user?.jobTitle}</span>
              </span>
              <ChevronDown size={15} className="text-white/60" />
            </button>
          )}
        >
          {({ close }) => (
            <div className="p-1.5">
              <div className="border-b border-line px-3 pb-3 pt-2">
                <p className="text-sm font-bold text-ink">{user?.fullName}</p>
                <p className="text-xs text-slate-500">{user?.email}</p>
              </div>
              <button
                type="button"
                onClick={async () => {
                  close();
                  await dispatch(logout());
                  navigate('/');
                }}
                className="mt-1 flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-danger transition hover:bg-danger-soft"
              >
                {t('nav.logout')}
              </button>
            </div>
          )}
        </Dropdown>
      </div>
    </header>
  );
};
