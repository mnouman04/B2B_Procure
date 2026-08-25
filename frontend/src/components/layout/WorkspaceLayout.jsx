import { useEffect, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout, selectUser } from '../../store/authSlice.js';
import { selectUnreadCount } from '../../store/notificationSlice.js';
import { useApi } from '../../hooks/useApi.js';
import { messageApi } from '../../api/endpoints.js';
import { Sidebar } from './Sidebar.jsx';
import { Topbar } from './Topbar.jsx';

/**
 * Two-pane workspace shell: a fixed navy rail plus a light content column,
 * mirrored automatically in RTL because the rail is positioned with
 * logical `start` insets.
 */
export const WorkspaceLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const unreadNotifications = useSelector(selectUnreadCount);

  // Drives the gold count chip on the Messages row of the sidebar.
  const { meta: conversationMeta, refresh: refreshConversations } =
    useApi(() => messageApi.conversations({ limit: 1 }), []);

  useEffect(() => {
    setSidebarOpen(false);
    refreshConversations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  const signOut = async () => {
    await dispatch(logout());
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-canvas">
      <Sidebar
        open={sidebarOpen}
        onNavigate={() => setSidebarOpen(false)}
        onSignOut={signOut}
        badges={{
          messages: conversationMeta?.totalUnread ?? 0,
          notifications: unreadNotifications,
        }}
        user={user}
      />

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-navy-950/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden
        />
      )}

      <div className="lg:ms-[248px]">
        <Topbar onToggleSidebar={() => setSidebarOpen((v) => !v)} />
        <main className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6 sm:py-7">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
