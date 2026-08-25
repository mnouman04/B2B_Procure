import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { Toaster } from 'react-hot-toast';

import { bootstrapSession } from '../store/authSlice.js';
import { ROLES } from './routes.js';

import { PublicLayout } from '../components/layout/PublicLayout.jsx';
import { WorkspaceLayout } from '../components/layout/WorkspaceLayout.jsx';
import { ProtectedRoute, GuestRoute } from '../components/layout/ProtectedRoute.jsx';

import { HomePage } from '../features/home/HomePage.jsx';
import {
  HowItWorksPage, ForBuyersPage, PricingPage, NotFoundPage,
} from '../features/home/MarketingPages.jsx';

import { LoginPage } from '../features/auth/LoginPage.jsx';
import { RegisterCompanyPage } from '../features/auth/RegisterCompanyPage.jsx';
import { RegisterSupplierPage } from '../features/auth/RegisterSupplierPage.jsx';

import { SupplierDirectoryPage } from '../features/suppliers/SupplierDirectoryPage.jsx';
import { SupplierProfilePage } from '../features/suppliers/SupplierProfilePage.jsx';

import { BuyerDashboard } from '../features/buyer/BuyerDashboard.jsx';
import { RfqListPage } from '../features/rfq/RfqListPage.jsx';
import { RfqDetailPage } from '../features/rfq/RfqDetailPage.jsx';
import { CreateRfqPage } from '../features/rfq/CreateRfqPage.jsx';
import { SupplierMatchingPage } from '../features/rfq/SupplierMatchingPage.jsx';
import { CompareQuotationsPage } from '../features/quotations/CompareQuotationsPage.jsx';
import { QuotationListPage } from '../features/quotations/QuotationListPage.jsx';
import { SubmitQuotationPage } from '../features/quotations/SubmitQuotationPage.jsx';
import { OrderListPage } from '../features/orders/OrderListPage.jsx';
import { OrderDetailPage } from '../features/orders/OrderDetailPage.jsx';
import { MessagesPage } from '../features/messages/MessagesPage.jsx';
import { ProcurementAnalyticsPage } from '../features/analytics/ProcurementAnalyticsPage.jsx';

import { SupplierDashboard } from '../features/supplier/SupplierDashboard.jsx';
import { VerificationPage } from '../features/supplier/VerificationPage.jsx';
import { ProductsPage } from '../features/supplier/ProductsPage.jsx';
import { SupplierReportsPage } from '../features/supplier/SupplierReportsPage.jsx';

import { AdminDashboard } from '../features/admin/AdminDashboard.jsx';
import { VerificationQueuePage } from '../features/admin/VerificationQueuePage.jsx';
import {
  AdminCompaniesPage, AdminSuppliersPage, AdminUsersPage,
  AdminRfqsPage, AdminCommissionsPage, AdminCategoriesPage,
} from '../features/admin/AdminListPages.jsx';

import { SettingsPage } from '../features/settings/SettingsPage.jsx';
import { CompanyProfilePage } from '../features/settings/CompanyProfilePage.jsx';

export const App = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(bootstrapSession());
  }, [dispatch]);

  return (
    <>
      <Routes>
        {/* ── Public ─────────────────────────────────────────── */}
        <Route element={<PublicLayout />}>
          <Route index element={<HomePage />} />
          <Route path="how-it-works" element={<HowItWorksPage />} />
          <Route path="for-buyers" element={<ForBuyersPage />} />
          <Route path="pricing" element={<PricingPage />} />
          <Route path="suppliers" element={<SupplierDirectoryPage />} />
          <Route path="suppliers/:idOrSlug" element={<SupplierProfilePage />} />
        </Route>

        {/* ── Auth ───────────────────────────────────────────── */}
        <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
        <Route path="/register" element={<GuestRoute><RegisterCompanyPage /></GuestRoute>} />
        <Route path="/register/supplier" element={<GuestRoute><RegisterSupplierPage /></GuestRoute>} />

        {/* ── Buyer workspace ────────────────────────────────── */}
        <Route element={<ProtectedRoute roles={[ROLES.BUYER, ROLES.ADMIN]} />}>
          <Route path="/buyer" element={<WorkspaceLayout />}>
            <Route index element={<BuyerDashboard />} />
            <Route path="rfqs" element={<RfqListPage />} />
            <Route path="rfqs/new" element={<CreateRfqPage />} />
            <Route path="rfqs/:id" element={<RfqDetailPage />} />
            <Route path="rfqs/:id/edit" element={<CreateRfqPage />} />
            <Route path="rfqs/:id/matches" element={<SupplierMatchingPage />} />
            <Route path="rfqs/:id/compare" element={<CompareQuotationsPage />} />
            <Route path="quotes" element={<QuotationListPage />} />
            <Route path="orders" element={<OrderListPage />} />
            <Route path="orders/:id" element={<OrderDetailPage />} />
            <Route path="deliveries" element={<OrderListPage deliveryView />} />
            <Route path="suppliers" element={<SupplierDirectoryPage embedded />} />
            <Route path="messages" element={<MessagesPage />} />
            <Route path="analytics" element={<ProcurementAnalyticsPage />} />
            <Route path="company" element={<CompanyProfilePage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
        </Route>

        {/* ── Supplier workspace ─────────────────────────────── */}
        <Route element={<ProtectedRoute roles={[ROLES.SUPPLIER, ROLES.ADMIN]} />}>
          <Route path="/supplier" element={<WorkspaceLayout />}>
            <Route index element={<SupplierDashboard />} />
            <Route path="rfqs" element={<RfqListPage />} />
            <Route path="rfqs/:id" element={<RfqDetailPage />} />
            <Route path="rfqs/:id/quote" element={<SubmitQuotationPage />} />
            <Route path="quotations" element={<QuotationListPage />} />
            <Route path="orders" element={<OrderListPage />} />
            <Route path="orders/:id" element={<OrderDetailPage />} />
            <Route path="products" element={<ProductsPage />} />
            <Route path="verification" element={<VerificationPage />} />
            <Route path="reports" element={<SupplierReportsPage />} />
            <Route path="messages" element={<MessagesPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
        </Route>

        {/* ── Admin workspace ────────────────────────────────── */}
        <Route element={<ProtectedRoute roles={[ROLES.ADMIN]} />}>
          <Route path="/admin" element={<WorkspaceLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="verification" element={<VerificationQueuePage />} />
            <Route path="companies" element={<AdminCompaniesPage />} />
            <Route path="suppliers" element={<AdminSuppliersPage />} />
            <Route path="rfqs" element={<AdminRfqsPage />} />
            <Route path="commissions" element={<AdminCommissionsPage />} />
            <Route path="categories" element={<AdminCategoriesPage />} />
            <Route path="users" element={<AdminUsersPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
        </Route>

        {/* Deep links shared between roles */}
        <Route path="/orders/:id" element={<Navigate to="/buyer/orders" replace />} />
        <Route path="/messages/:id" element={<Navigate to="/buyer/messages" replace />} />

        <Route element={<PublicLayout />}>
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>

      <Toaster
        position="top-center"
        toastOptions={{
          duration: 4000,
          style: {
            borderRadius: '10px',
            background: '#0B1B3A',
            color: '#fff',
            fontSize: '13.5px',
            padding: '10px 16px',
          },
          success: { iconTheme: { primary: '#E9C46A', secondary: '#0B1B3A' } },
        }}
      />
    </>
  );
};
