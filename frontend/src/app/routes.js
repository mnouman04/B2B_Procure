import {
  LayoutDashboard, FileText, Inbox, ClipboardList, Truck, Users,
  MessageSquare, BarChart3, Building2, Settings, Package, ShieldCheck,
  Receipt, Tags, UserCog,
} from 'lucide-react';

export const ROLES = { BUYER: 'buyer', SUPPLIER: 'supplier', ADMIN: 'admin' };

/** Where each role lands after signing in. */
export const workspaceHome = (role) =>
  ({ buyer: '/buyer', supplier: '/supplier', admin: '/admin' })[role] ?? '/';

/**
 * Sidebar definitions per role. `labelKey` is resolved through i18n so the
 * navy rail reads correctly in both English and Arabic.
 */
export const NAV = {
  [ROLES.BUYER]: [
    { to: '/buyer', end: true, labelKey: 'sidebar.dashboard', icon: LayoutDashboard },
    { to: '/buyer/rfqs', labelKey: 'sidebar.myRfqs', icon: FileText },
    { to: '/buyer/quotes', labelKey: 'sidebar.quotesReceived', icon: Inbox },
    { to: '/buyer/orders', labelKey: 'sidebar.purchaseOrders', icon: ClipboardList },
    { to: '/buyer/deliveries', labelKey: 'sidebar.ordersDeliveries', icon: Truck },
    { to: '/buyer/suppliers', labelKey: 'sidebar.suppliers', icon: Users },
    { to: '/buyer/messages', labelKey: 'sidebar.messages', icon: MessageSquare, badge: 'messages' },
    { to: '/buyer/analytics', labelKey: 'sidebar.analytics', icon: BarChart3 },
    { to: '/buyer/company', labelKey: 'sidebar.companyProfile', icon: Building2 },
    { to: '/buyer/settings', labelKey: 'sidebar.settings', icon: Settings },
  ],
  [ROLES.SUPPLIER]: [
    { to: '/supplier', end: true, labelKey: 'sidebar.dashboard', icon: LayoutDashboard },
    { to: '/supplier/rfqs', labelKey: 'sidebar.rfqRequests', icon: FileText, badge: 'rfqs' },
    { to: '/supplier/quotations', labelKey: 'sidebar.myQuotations', icon: Inbox },
    { to: '/supplier/orders', labelKey: 'sidebar.purchaseOrders', icon: ClipboardList },
    { to: '/supplier/products', labelKey: 'sidebar.productsServices', icon: Package },
    { to: '/supplier/verification', labelKey: 'sidebar.documents', icon: ShieldCheck },
    { to: '/supplier/reports', labelKey: 'sidebar.reports', icon: BarChart3 },
    { to: '/supplier/messages', labelKey: 'sidebar.messages', icon: MessageSquare, badge: 'messages' },
    { to: '/supplier/settings', labelKey: 'sidebar.settings', icon: Settings },
  ],
  [ROLES.ADMIN]: [
    { to: '/admin', end: true, labelKey: 'sidebar.dashboard', icon: LayoutDashboard },
    { to: '/admin/verification', labelKey: 'sidebar.verification', icon: ShieldCheck, badge: 'verification' },
    { to: '/admin/companies', labelKey: 'sidebar.companies', icon: Building2 },
    { to: '/admin/suppliers', labelKey: 'sidebar.suppliers', icon: Users },
    { to: '/admin/rfqs', labelKey: 'sidebar.allRfqs', icon: FileText },
    { to: '/admin/commissions', labelKey: 'sidebar.commissions', icon: Receipt },
    { to: '/admin/categories', labelKey: 'sidebar.categories', icon: Tags },
    { to: '/admin/users', labelKey: 'sidebar.users', icon: UserCog },
  ],
};

export const roleLabelKey = (role) =>
  ({ buyer: 'sidebar.buyer', supplier: 'sidebar.supplier', admin: 'sidebar.admin' })[role] ?? '';
