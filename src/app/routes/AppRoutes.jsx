import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Layouts
import { PublicLayout } from '../layouts/PublicLayout';
import { CustomerLayout } from '../layouts/CustomerLayout';
import { ProviderLayout } from '../layouts/ProviderLayout';
import { AdminLayout } from '../layouts/AdminLayout';
import { ArbitratorLayout } from '../layouts/ArbitratorLayout';

// Public Pages
import { LandingPage } from '../../features/public/LandingPage';
import { ServiceSearchPage } from '../../features/public/ServiceSearchPage';
import { ServiceDetailPage } from '../../features/public/ServiceDetailPage';
import { PostAJobPage } from '../../features/public/PostAJobPage';
import { HelpPage } from '../../features/public/HelpPage';
import { LoginPage } from '../../features/auth/LoginPage';
import { SignupPage } from '../../features/auth/SignupPage';

// Customer Pages
import { CustomerDashboard } from '../../features/customer/CustomerDashboard';
import { BookingWizard } from '../../features/customer/BookingWizard';
import { BookingsListPage } from '../../features/customer/BookingsListPage';
import { BookingDetailPage } from '../../features/customer/BookingDetailPage';
import { SupportTicketPage } from '../../features/customer/SupportTicketPage';
import { DisputeFilingPage } from '../../features/customer/DisputeFilingPage';

// Provider Pages
import { ProviderDashboard } from '../../features/provider/ProviderDashboard';
import { ProviderOnboardingPage } from '../../features/provider/ProviderOnboardingPage';
import { ListingManagerPage } from '../../features/provider/ListingManagerPage';
import { AvailabilitySchedulerPage } from '../../features/provider/AvailabilitySchedulerPage';
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
        <Route path="/" element={<LandingPage />} />
        <Route path="/services" element={<ServiceSearchPage />} />
        <Route path="/services/:serviceId" element={<ServiceDetailPage />} />
        <Route path="/post-a-job" element={<PostAJobPage />} />
        <Route path="/help" element={<HelpPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
      </Route>

      {/* Customer Protected Routes */}
      <Route element={<CustomerLayout />}>
        <Route path="/customer" element={<CustomerDashboard />} />
        <Route path="/customer/checkout" element={<BookingWizard />} />
        <Route path="/customer/bookings" element={<BookingsListPage />} />
        <Route path="/customer/bookings/:bookingId" element={<BookingDetailPage />} />
        <Route path="/customer/saved" element={<BookingsListPage />} />
        <Route path="/customer/support" element={<SupportTicketPage />} />
        <Route path="/customer/support/new" element={<SupportTicketPage />} />
        <Route path="/customer/dispute/new" element={<DisputeFilingPage />} />
        <Route path="/customer/profile" element={<CustomerDashboard />} />
      </Route>

      {/* Provider Protected Routes */}
      <Route element={<ProviderLayout />}>
        <Route path="/provider" element={<ProviderDashboard />} />
        <Route path="/provider/services" element={<ListingManagerPage />} />
        <Route path="/provider/services/new" element={<ListingManagerPage />} />
        <Route path="/provider/availability" element={<AvailabilitySchedulerPage />} />
        <Route path="/provider/jobs" element={<JobInboxPage />} />
        <Route path="/provider/jobs/:jobId" element={<JobDetailPage />} />
        <Route path="/provider/earnings" element={<EarningsPage />} />
        <Route path="/provider/reviews" element={<ReviewsPage />} />
        <Route path="/provider/profile" element={<ProviderOnboardingPage />} />
      </Route>

      {/* Admin Protected Routes */}
      <Route element={<AdminLayout />}>
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
      <Route element={<ArbitratorLayout />}>
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
