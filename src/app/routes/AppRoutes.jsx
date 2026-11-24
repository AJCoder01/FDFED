import { lazy, Suspense } from 'react';
import { Skeleton } from '../../design-system/primitives/Skeleton';
import { Routes, Route, Navigate } from 'react-router-dom';

// Layouts
import { PublicLayout } from '../layouts/PublicLayout';
import { CustomerLayout } from '../layouts/CustomerLayout';
import { ProviderLayout } from '../layouts/ProviderLayout';
import { AdminLayout } from '../layouts/AdminLayout';
import { ArbitratorLayout } from '../layouts/ArbitratorLayout';
import { AuthGuard } from './AuthGuard';

// Public Pages
import { ServiceSearchPage } from '../../features/public/ServiceSearchPage';
import { ServiceDetailPage } from '../../features/public/ServiceDetailPage';
import { PostAJobPage } from '../../features/public/PostAJobPage';
import { HelpPage } from '../../features/public/HelpPage';
import { LoginPage } from '../../features/auth/LoginPage';
import { SignupPage } from '../../features/auth/SignupPage';

const lazyPage = (load, name) => lazy(async () => ({ default: (await load())[name] }));
const LandingPage = lazyPage(() => import('../../features/public/LandingPage'), 'LandingPage');

// Customer Pages
const CustomerDashboard = lazyPage(() => import('../../features/customer/CustomerDashboard'), 'CustomerDashboard');
const CustomerProfilePage = lazyPage(() => import('../../features/customer/CustomerProfilePage'), 'CustomerProfilePage');
const BookingWizard = lazyPage(() => import('../../features/customer/BookingWizard'), 'BookingWizard');
const BookingsListPage = lazyPage(() => import('../../features/customer/BookingsListPage'), 'BookingsListPage');
const BookingDetailPage = lazyPage(() => import('../../features/customer/BookingDetailPage'), 'BookingDetailPage');
const SupportTicketPage = lazyPage(() => import('../../features/customer/SupportTicketPage'), 'SupportTicketPage');
const DisputeFilingPage = lazyPage(() => import('../../features/customer/DisputeFilingPage'), 'DisputeFilingPage');

// Provider Pages
const ProviderDashboard = lazyPage(() => import('../../features/provider/ProviderDashboard'), 'ProviderDashboard');
const ProviderProfilePage = lazyPage(() => import('../../features/provider/ProviderProfilePage'), 'ProviderProfilePage');
const ListingManagerPage = lazyPage(() => import('../../features/provider/ListingManagerPage'), 'ListingManagerPage');
const JobInboxPage = lazyPage(() => import('../../features/provider/JobInboxPage'), 'JobInboxPage');
const JobDetailPage = lazyPage(() => import('../../features/provider/JobDetailPage'), 'JobDetailPage');
const EarningsPage = lazyPage(() => import('../../features/provider/EarningsPage'), 'EarningsPage');
const ReviewsPage = lazyPage(() => import('../../features/provider/ReviewsPage'), 'ReviewsPage');
const AvailabilityPage = lazyPage(() => import('../../features/provider/AvailabilityPage'), 'AvailabilityPage');

// Admin Pages
const AdminDashboard = lazyPage(() => import('../../features/admin/AdminDashboard'), 'AdminDashboard');
const AdminServicesPage = lazyPage(() => import('../../features/admin/AdminServicesPage'), 'AdminServicesPage');
const AdminAccountsPage = lazyPage(() => import('../../features/admin/AdminAccountsPage'), 'AdminAccountsPage');
const ArbitratorApplicationPage = lazyPage(() => import('../../features/admin/ArbitratorApplicationPage'), 'ArbitratorApplicationPage');
const BookingInspectorPage = lazyPage(() => import('../../features/admin/BookingInspectorPage'), 'BookingInspectorPage');
const TicketResolutionPage = lazyPage(() => import('../../features/admin/TicketResolutionPage'), 'TicketResolutionPage');
const CategoryManagerPage = lazyPage(() => import('../../features/admin/CategoryManagerPage'), 'CategoryManagerPage');
const DisputeAssignmentPage = lazyPage(() => import('../../features/admin/DisputeAssignmentPage'), 'DisputeAssignmentPage');
const AdminRevenuePage = lazyPage(() => import('../../features/admin/AdminRevenuePage'), 'AdminRevenuePage');
const AdminProfilePage = lazyPage(() => import('../../features/admin/AdminProfilePage'), 'AdminProfilePage');
const ProviderModerationPage = lazyPage(() => import('../../features/admin/ProviderModerationPage'), 'ProviderModerationPage');

// Arbitrator Pages
const ArbitratorDashboard = lazyPage(() => import('../../features/arbitrator/ArbitratorDashboard'), 'ArbitratorDashboard');
const ArbitratorCasesPage = lazyPage(() => import('../../features/arbitrator/ArbitratorCasesPage'), 'ArbitratorCasesPage');
const DisputeCaseDetailPage = lazyPage(() => import('../../features/arbitrator/DisputeCaseDetailPage'), 'DisputeCaseDetailPage');
const HearingSchedulerPage = lazyPage(() => import('../../features/arbitrator/HearingSchedulerPage'), 'HearingSchedulerPage');
const RulingIssuancePage = lazyPage(() => import('../../features/arbitrator/RulingIssuancePage'), 'RulingIssuancePage');
const ArbitratorProfilePage = lazyPage(() => import('../../features/arbitrator/ArbitratorProfilePage'), 'ArbitratorProfilePage');

export function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Suspense fallback={<Skeleton height="400px" />}><LandingPage /></Suspense>} />
        <Route path="/services" element={<ServiceSearchPage />} />
        <Route path="/services/:serviceId" element={<ServiceDetailPage />} />
        <Route path="/post-a-job" element={<PostAJobPage />} />
        <Route path="/help" element={<HelpPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
      </Route>

      {/* Customer Protected Routes */}
      <Route element={<AuthGuard allowedRoles={['customer']}><CustomerLayout /></AuthGuard>}>
        <Route path="/customer" element={<CustomerDashboard />} />
        <Route path="/customer/services" element={<ServiceSearchPage />} />
        <Route path="/customer/services/:serviceId" element={<ServiceDetailPage />} />
        <Route path="/customer/checkout" element={<BookingWizard />} />
        <Route path="/customer/bookings" element={<BookingsListPage />} />
        <Route path="/customer/bookings/:bookingId" element={<BookingDetailPage />} />
        <Route path="/customer/support" element={<SupportTicketPage />} />
        <Route path="/customer/support/new" element={<SupportTicketPage />} />
        <Route path="/customer/dispute/new" element={<DisputeFilingPage />} />
        <Route path="/customer/profile" element={<CustomerProfilePage />} />
      </Route>

      {/* Provider Protected Routes */}
      <Route element={<AuthGuard allowedRoles={['provider']}><ProviderLayout /></AuthGuard>}>
        <Route path="/provider" element={<ProviderDashboard />} />
        <Route path="/provider/services" element={<ListingManagerPage />} />
        <Route path="/provider/services/new" element={<ListingManagerPage />} />
        <Route path="/provider/jobs" element={<JobInboxPage />} />
        <Route path="/provider/jobs/:jobId" element={<JobDetailPage />} />
        <Route path="/provider/earnings" element={<EarningsPage />} />
        <Route path="/provider/reviews" element={<ReviewsPage />} />
        <Route path="/provider/availability" element={<AvailabilityPage />} />
        <Route path="/provider/profile" element={<ProviderProfilePage />} />
      </Route>

      {/* Admin Protected Routes */}
      <Route element={<AuthGuard allowedRoles={['admin']}><AdminLayout /></AuthGuard>}>
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/services" element={<AdminServicesPage />} />
        <Route path="/admin/accounts" element={<AdminAccountsPage />} />
        <Route path="/admin/revenue" element={<AdminRevenuePage />} />
        <Route path="/admin/arbitrator-applications" element={<ArbitratorApplicationPage />} />
        <Route path="/admin/bookings" element={<BookingInspectorPage />} />
        <Route path="/admin/tickets" element={<TicketResolutionPage />} />
        <Route path="/admin/categories" element={<CategoryManagerPage />} />
        <Route path="/admin/disputes" element={<DisputeAssignmentPage />} />
        <Route path="/admin/profile" element={<AdminProfilePage />} />
        <Route path="/admin/providers" element={<ProviderModerationPage />} />
        <Route path="/admin/listings" element={<Navigate to="/admin/services" replace />} />
      </Route>

      {/* Arbitrator Protected Routes */}
      <Route element={<AuthGuard allowedRoles={['arbitrator']}><ArbitratorLayout /></AuthGuard>}>
        <Route path="/arbitrator" element={<ArbitratorDashboard />} />
        <Route path="/arbitrator/cases" element={<ArbitratorCasesPage />} />
        <Route path="/arbitrator/cases/:caseId" element={<DisputeCaseDetailPage />} />
        <Route path="/arbitrator/hearings" element={<HearingSchedulerPage />} />
        <Route path="/arbitrator/rulings" element={<RulingIssuancePage />} />
        <Route path="/arbitrator/profile" element={<ArbitratorProfilePage />} />
      </Route>

      {/* Fallback 404 Route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
