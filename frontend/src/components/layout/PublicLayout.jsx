import { Outlet, useLocation } from 'react-router-dom';
import { PublicHeader } from './PublicHeader.jsx';
import { PublicFooter } from './PublicFooter.jsx';

export const PublicLayout = () => {
  const { pathname } = useLocation();
  const isHome = pathname === '/';

  return (
    <div className="flex min-h-screen flex-col">
      <PublicHeader overlay={isHome} />
      <main className="flex-1">
        <Outlet />
      </main>
      <PublicFooter />
    </div>
  );
};
