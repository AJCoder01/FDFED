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
const LandingPage = lazy(() => import('../../features/public/LandingPage').then(module => ({ default: module.LandingPage })));
import { ServiceSearchPage } from '../../features/public/ServiceSearchPage';
import { ServiceDetailPage } from '../../features/public/ServiceDetailPage';
import { PostAJobPage } from '../../features/public/PostAJobPage';
import { HelpPage } from '../../features/public/HelpPage';
import { LoginPage } from '../../features/auth/LoginPage';
import { SignupPage } from '../../features/auth/SignupPage';

// Customer Pages
import { CustomerDashboard } from '../../features/customer/CustomerDashboard';
import { CustomerProfilePage } from '../../features/customer/CustomerProfilePage';
import { BookingWizard } from '../../features/customer/BookingWizard';
import { BookingsListPage } from '../../features/customer/BookingsListPage';
import { BookingDetailPage } from '../../features/customer/BookingDetailPage';
import { SupportTicketPage } from '../../features/customer/SupportTicketPage';
import { DisputeFilingPage } from '../../features/customer/DisputeFilingPage';

// Provider Pages
import { ProviderDashboard } from '../../features/provider/ProviderDashboard';
import { ProviderOnboardingPage } from '../../features/provider/ProviderOnboardingPage';
import { ListingManagerPage } from '../../features/provider/ListingManagerPage';
import { JobInboxPage } from '../../features/provider/JobInboxPage';
import { JobDetailPage } from '../../features/provider/JobDetailPage';
import { EarningsPage } from '../../features/provider/EarningsPage';
import { ReviewsPage } from '../../features/provider/ReviewsPage';

// Admin Pages
import { AdminDashboard } from '../../features/admin/AdminDashboard';
import { ProviderModerationPage } from '../../features/admin/ProviderModerationPage';
import { ListingModerationPage } from '../../features/admin/ListingModerationPage';
import { BookingInspectorPage } from '../../features/admin/BookingInspectorPage';
import { TicketResolutionPage } from '../../features/admin/TicketResolutionPage';
import { CategoryManagerPage } from '../../features/admin/CategoryManagerPage';
import { DisputeAssignmentPage } from '../../features/admin/DisputeAssignmentPage';
import { AdminRevenuePage } from '../../features/admin/AdminRevenuePage';
import { AdminProfilePage } from '../../features/admin/AdminProfilePage';

// Arbitrator Pages
import { ArbitratorDashboard } from '../../features/arbitrator/ArbitratorDashboard';
import { DisputeCaseDetailPage } from '../../features/arbitrator/DisputeCaseDetailPage';
import { HearingSchedulerPage } from '../../features/arbitrator/HearingSchedulerPage';
import { RulingIssuancePage } from '../../features/arbitrator/RulingIssuancePage';
import { ArbitratorProfilePage } from '../../features/arbitrator/ArbitratorProfilePage';

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
        <Route path="/provider/profile" element={<ProviderOnboardingPage />} />
      </Route>

      {/* Admin Protected Routes */}
      <Route element={<AuthGuard allowedRoles={['admin']}><AdminLayout /></AuthGuard>}>
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/revenue" element={<AdminRevenuePage />} />
        <Route path="/admin/providers" element={<ProviderModerationPage />} />
        <Route path="/admin/listings" element={<ListingModerationPage />} />
        <Route path="/admin/bookings" element={<BookingInspectorPage />} />
        <Route path="/admin/tickets" element={<TicketResolutionPage />} />
        <Route path="/admin/categories" element={<CategoryManagerPage />} />
        <Route path="/admin/disputes" element={<DisputeAssignmentPage />} />
        <Route path="/admin/profile" element={<AdminProfilePage />} />
      </Route>

      {/* Arbitrator Protected Routes */}
      <Route element={<AuthGuard allowedRoles={['arbitrator']}><ArbitratorLayout /></AuthGuard>}>
        <Route path="/arbitrator" element={<ArbitratorDashboard />} />
        <Route path="/arbitrator/cases" element={<ArbitratorDashboard />} />
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
