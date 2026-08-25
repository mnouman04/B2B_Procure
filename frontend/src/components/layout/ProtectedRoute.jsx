import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectUser, selectBootstrapped } from '../../store/authSlice.js';
import { workspaceHome } from '../../app/routes.js';
import { PageLoader } from '../ui/Misc.jsx';

/**
 * Route guard. Waits for the session bootstrap so a hard refresh on a deep
 * link does not bounce an authenticated user back to the login screen.
 */
export const ProtectedRoute = ({ roles }) => {
  const user = useSelector(selectUser);
  const bootstrapped = useSelector(selectBootstrapped);
  const location = useLocation();

  if (!bootstrapped) return <PageLoader />;
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  if (roles?.length && !roles.includes(user.role)) {
    return <Navigate to={workspaceHome(user.role)} replace />;
  }
  return <Outlet />;
};

/** Keeps signed-in users away from the login / register screens. */
export const GuestRoute = ({ children }) => {
  const user = useSelector(selectUser);
  const bootstrapped = useSelector(selectBootstrapped);
  if (!bootstrapped) return <PageLoader />;
  if (user) return <Navigate to={workspaceHome(user.role)} replace />;
  return children;
};
