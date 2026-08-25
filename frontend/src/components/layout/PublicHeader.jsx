import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { ChevronDown, Globe, Menu, X, LayoutDashboard } from 'lucide-react';
import clsx from 'clsx';
import { useI18n } from '../../i18n/index.jsx';
import { selectUser, logout } from '../../store/authSlice.js';
import { Logo } from './Logo.jsx';
import { Button } from '../ui/Button.jsx';
import { Avatar } from '../ui/Misc.jsx';
import { Dropdown } from '../ui/Dropdown.jsx';
import { workspaceHome } from '../../app/routes.js';

/**
 * The transparent navy header that sits over the home-page hero:
 * logo, primary nav, language switch, Log In and a gold Sign Up pill.
 */
export const PublicHeader = ({ overlay = false }) => {
  const { t, toggleLocale } = useI18n();
  const user = useSelector(selectUser);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const links = [
    { to: '/how-it-works', label: t('nav.howItWorks') },
    { to: '/for-buyers', label: t('nav.forBuyers') },
    { to: '/suppliers', label: t('nav.forSuppliers') },
    { to: '/pricing', label: t('nav.pricing') },
  ];

  return (
    <header
      className={clsx(
        'z-30 w-full',
        overlay ? 'absolute inset-x-0 top-0 bg-transparent' : 'sticky top-0 bg-navy-900 shadow-sm',
      )}
    >
      <div className="mx-auto flex h-[70px] max-w-[1280px] items-center gap-6 px-5">
        <Link to="/" className="shrink-0">
          <Logo theme="dark" />
        </Link>

        <nav className="hidden flex-1 items-center justify-center gap-7 lg:flex">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                clsx(
                  'text-[13.5px] font-medium transition',
                  isActive ? 'text-gold-300' : 'text-white/85 hover:text-white',
                )
              }
            >
              {link.label}
            </NavLink>
          ))}
          <button
            type="button"
            className="inline-flex items-center gap-1 text-[13.5px] font-medium text-white/85 transition hover:text-white"
          >
            {t('nav.resources')}
            <ChevronDown size={14} />
          </button>
        </nav>

        <div className="ms-auto flex items-center gap-2.5 lg:ms-0">
          <button
            type="button"
            onClick={toggleLocale}
            className="hidden items-center gap-1.5 rounded-lg px-2.5 py-2 text-[13px] font-medium text-white/85 transition hover:bg-white/10 hover:text-white sm:inline-flex"
          >
            <Globe size={15} />
            {t('common.language')}
          </button>

          {user ? (
            <Dropdown
              trigger={({ toggle }) => (
                <button
                  type="button"
                  onClick={toggle}
                  className="flex items-center gap-2 rounded-lg px-2 py-1.5 transition hover:bg-white/10"
                >
                  <Avatar name={user.fullName} size={32} rounded="full" />
                  <span className="hidden text-start sm:block">
                    <span className="block text-[13px] font-semibold leading-tight text-white">
                      {user.fullName}
                    </span>
                    <span className="block text-[11px] leading-tight text-white/60">{user.jobTitle}</span>
                  </span>
                  <ChevronDown size={15} className="text-white/70" />
                </button>
              )}
            >
              {({ close }) => (
                <div className="p-1.5">
                  <Link
                    to={workspaceHome(user.role)}
                    onClick={close}
                    className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-ink transition hover:bg-slate-50"
                  >
                    <LayoutDashboard size={16} className="text-slate-400" />
                    {t('nav.dashboard')}
                  </Link>
                  <button
                    type="button"
                    onClick={async () => {
                      close();
                      await dispatch(logout());
                      navigate('/');
                    }}
                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-danger transition hover:bg-danger-soft"
                  >
                    {t('nav.logout')}
                  </button>
                </div>
              )}
            </Dropdown>
          ) : (
            <>
              <Button
                as={Link}
                to="/login"
                size="sm"
                variant="outlineLight"
              >
                {t('nav.login')}
              </Button>
              <Button as={Link} to="/register" size="sm" variant="gold">
                {t('nav.signUp')}
              </Button>
            </>
          )}

          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            className="rounded-lg p-2 text-white lg:hidden"
            aria-label="Menu"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="border-t border-white/10 bg-navy-900 px-5 pb-4 lg:hidden">
          {links.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              onClick={() => setMobileOpen(false)}
              className="block py-2.5 text-sm font-medium text-white/85"
            >
              {link.label}
            </Link>
          ))}
          <button
            type="button"
            onClick={toggleLocale}
            className="flex items-center gap-2 py-2.5 text-sm font-medium text-white/85"
          >
            <Globe size={15} />
            {t('common.language')}
          </button>
        </div>
      )}
    </header>
  );
};
