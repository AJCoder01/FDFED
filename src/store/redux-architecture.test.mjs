import assert from 'node:assert/strict';
import { after, beforeEach, test } from 'node:test';
import { createAppStore } from './index.js';
import { setAccessToken } from '../repositories/apiClient.js';
import { loginUser, logoutUser, selectCurrentRole, selectCurrentUser, switchDemoRole } from './slices/authSlice.js';
import {
  createUserAccount,
  deleteUserAccount,
  fetchAccounts,
  fetchProviders,
  moderateProvider,
  saveCustomerAddresses,
  selectAccounts,
  selectProviders,
  updateUserProfile,
} from './slices/usersSlice.js';
import {
  createCategory,
  createJobRequest,
  createService,
  deleteCategory,
  deleteService,
  fetchCategories,
  fetchServices,
  selectCategories,
  selectJobRequests,
  selectServices,
  updateCategory,
  updateService,
} from './slices/marketplaceSlice.js';
import {
  createBooking,
  deleteBooking,
  fetchAvailableSlots,
  fetchBookings,
  selectBookings,
  selectSlotsByKey,
  updateBookingStatus,
} from './slices/bookingsSlice.js';
import {
  createLedger,
  deleteLedger,
  fetchLedgers,
  fetchRevenueStats,
  fetchWallet,
  issueRefund,
  selectLedgers,
  selectRevenueStats,
  selectWalletBalance,
  selectWalletTransactions,
  topUpWallet,
  updateLedger,
  withdrawWallet,
} from './slices/financeSlice.js';
import {
  approveArbitratorApplication,
  assignDispute,
  createDispute,
  createTicket,
  deleteDispute,
  deleteTicket,
  fetchArbitratorApplications,
  fetchDisputes,
  fetchTickets,
  issueRuling,
  resolveTicket,
  selectArbitratorApplications,
  selectDisputes,
  selectTickets,
} from './slices/governanceSlice.js';
import {
  clearNotifications,
  createNotification,
  deleteNotification,
  fetchNotifications,
  markNotificationsRead,
  selectNotifications,
} from './slices/notificationsSlice.js';
import {
  createActivityLog,
  deleteActivityLog,
  fetchActivityLogs,
  fetchPlatformStats,
  resetDemoData,
  selectActivityLogs,
  selectPlatformStats,
  updateActivityLog,
} from './slices/platformSlice.js';

let mockHandler = null;
const recordedCalls = [];

beforeEach(() => {
  recordedCalls.length = 0;
  setAccessToken(null);
  globalThis.fetch = async (url, init = {}) => {
    const method = init.method || 'GET';
    const body = init.body ? JSON.parse(init.body) : undefined;
    recordedCalls.push({ url, method, headers: init.headers || {}, body });
    const result = await mockHandler({ url, method, headers: init.headers || {}, body });
    return {
      ok: result.status >= 200 && result.status < 300,
      status: result.status,
      text: async () => (result.data !== undefined ? JSON.stringify(result.data) : ''),
    };
  };
});

after(() => {
  setAccessToken(null);
});

test('1:1 repository-to-slice architecture configures all 8 domain slices in store', () => {
  const store = createAppStore();
  const state = store.getState();
  const domainKeys = Object.keys(state).filter((k) => k !== 'ui');
  assert.deepEqual(domainKeys.sort(), [
    'auth',
    'bookings',
    'finance',
    'governance',
    'marketplace',
    'notifications',
    'platform',
    'users',
  ]);
});

test('strict pessimistic thunk pattern: pending and rejected responses NEVER mutate domain state', async () => {
  const store = createAppStore({
    marketplace: {
      categories: [],
      services: [{ id: 'srv-1', title: 'Existing AC Clean', price: 799, status: 'published' }],
      selectedService: null,
      reviewsByServiceId: {},
      jobRequests: [],
      loading: false,
      error: null,
      mutationStatus: 'idle',
      mutationError: null,
    },
  });

  let releasePromise;
  mockHandler = () =>
    new Promise((resolve) => {
      releasePromise = () => resolve({ status: 500, data: { message: 'PostgreSQL constraint error' } });
    });

  const pendingDispatch = store.dispatch(createService({ title: 'Should Not Optimistically Appear', price: 500 }));
  // Immediately after dispatch (while .pending), Redux MUST still hold only the 1 original service
  assert.equal(selectServices(store.getState()).length, 1);
  assert.equal(store.getState().marketplace.mutationStatus, 'loading');

  releasePromise();
  const result = await pendingDispatch;
  assert.equal(result.meta.requestStatus, 'rejected');
  assert.equal(selectServices(store.getState()).length, 1);
  assert.equal(store.getState().marketplace.mutationStatus, 'failed');
  assert.equal(store.getState().marketplace.mutationError, 'PostgreSQL constraint error');
});

test('authSlice: login, JWT attachment, demo-switch, and logout update Redux only on 2xx', async () => {
  const store = createAppStore();
  mockHandler = ({ url }) => {
    if (url.endsWith('/auth/login')) {
      return {
        status: 200,
        data: {
          accessToken: 'jwt-token-123',
          user: { id: 'user-cust-1', name: 'Aarav Mehta', email: 'aarav@gmail.com', role: 'customer' },
        },
      };
    }
    if (url.endsWith('/auth/demo-switch')) {
      return {
        status: 200,
        data: {
          accessToken: 'jwt-prov-456',
          user: { id: 'user-prov-1', name: 'Rohan Verma', role: 'provider', businessName: 'UrbanFix' },
        },
      };
    }
    if (url.endsWith('/auth/logout')) {
      return { status: 200, data: { success: true } };
    }
    return { status: 404, data: { message: 'Not found' } };
  };

  await store.dispatch(loginUser({ email: 'aarav@gmail.com', password: '123456Ab@', expectedRole: 'customer' })).unwrap();
  assert.equal(selectCurrentRole(store.getState()), 'customer');
  assert.equal(selectCurrentUser(store.getState()).name, 'Aarav Mehta');

  await store.dispatch(switchDemoRole('provider')).unwrap();
  assert.equal(selectCurrentRole(store.getState()), 'provider');
  assert.equal(recordedCalls[1].headers.Authorization, 'Bearer jwt-token-123');

  await store.dispatch(logoutUser()).unwrap();
  assert.equal(selectCurrentRole(store.getState()), 'guest');
  assert.equal(selectCurrentUser(store.getState()), null);
});

test('usersSlice + marketplaceSlice + bookingsSlice: full CRUD lifecycle through pessimistic thunks', async () => {
  const store = createAppStore({
    auth: {
      currentUser: { id: 'user-cust-1', name: 'Aarav Mehta', role: 'customer', addresses: [] },
      currentRole: 'customer',
      accessToken: 'jwt-test',
      isSuperUser: false,
      isSuperUserDemoMode: false,
      savedIntent: null,
      hydrated: true,
      loading: false,
      error: null,
      mutationStatus: 'idle',
      mutationError: null,
    },
  });

  mockHandler = ({ url, method, body }) => {
    if (url.endsWith('/users/accounts') && method === 'GET') {
      return { status: 200, data: [{ id: 'user-cust-1', name: 'Aarav Mehta', role: 'customer' }] };
    }
    if (url.endsWith('/users/accounts') && method === 'POST') {
      return { status: 201, data: { user: { id: 'user-new-1', ...body } } };
    }
    if (url.endsWith('/users/user-cust-1/profile') && method === 'PATCH') {
      return { status: 200, data: { id: 'user-cust-1', name: body.name, role: 'customer' } };
    }
    if (url.endsWith('/users/customers/user-cust-1/addresses') && method === 'PUT') {
      return { status: 200, data: { id: 'user-cust-1', addresses: body.addresses } };
    }
    if (url.endsWith('/users/providers') && method === 'GET') {
      return { status: 200, data: [{ id: 'user-prov-1', businessName: 'UrbanFix', verificationStatus: 'submitted' }] };
    }
    if (url.endsWith('/users/providers/user-prov-1/moderate') && method === 'PATCH') {
      return { status: 200, data: { id: 'user-prov-1', businessName: 'UrbanFix', verificationStatus: body.status } };
    }
    if (url.endsWith('/users/user-new-1') && method === 'DELETE') {
      return { status: 200, data: { success: true } };
    }
    if (url.endsWith('/marketplace/categories') && method === 'GET') {
      return { status: 200, data: [{ id: 'cat-1', name: 'Home Cleaning', slug: 'home-cleaning' }] };
    }
    if (url.endsWith('/marketplace/categories') && method === 'POST') {
      return { status: 201, data: { id: 'cat-9', ...body } };
    }
    if (url.endsWith('/marketplace/categories/cat-9') && method === 'PATCH') {
      return { status: 200, data: { id: 'cat-9', name: body.name } };
    }
    if (url.endsWith('/marketplace/categories/cat-9') && method === 'DELETE') {
      return { status: 200, data: { success: true } };
    }
    if (url.includes('/marketplace/services') && method === 'GET') {
      return { status: 200, data: [{ id: 'srv-1', title: 'AC Clean', price: 799, status: 'published' }] };
    }
    if (url.endsWith('/marketplace/services') && method === 'POST') {
      return { status: 201, data: { id: 'srv-99', ...body } };
    }
    if (url.endsWith('/marketplace/services/srv-99') && method === 'PATCH') {
      return { status: 200, data: { id: 'srv-99', title: 'AC Clean', price: 899, status: body.status } };
    }
    if (url.endsWith('/marketplace/services/srv-99') && method === 'DELETE') {
      return { status: 200, data: { success: true } };
    }
    if (url.endsWith('/marketplace/job-requests') && method === 'POST') {
      return { status: 201, data: { id: 'REQ-1001', ...body } };
    }
    if (url.includes('/bookings/available-slots') && method === 'GET') {
      return { status: 200, data: ['09:00 AM', '11:30 AM'] };
    }
    if (url.endsWith('/bookings') && method === 'GET') {
      return { status: 200, data: [] };
    }
    if (url.endsWith('/bookings') && method === 'POST') {
      return { status: 201, data: { id: 'BK-999', ...body, status: 'active' } };
    }
    if (url.endsWith('/bookings/BK-999/status') && method === 'PATCH') {
      return { status: 200, data: { id: 'BK-999', status: body.status, paymentStatus: 'Refunded' } };
    }
    if (url.endsWith('/bookings/BK-999') && method === 'DELETE') {
      return { status: 200, data: { success: true } };
    }
    return { status: 404, data: { message: `Unhandled ${method} ${url}` } };
  };

  // Users CRUD
  await store.dispatch(fetchAccounts()).unwrap();
  await store.dispatch(createUserAccount({ name: 'New User', email: 'new@test.in', role: 'customer' })).unwrap();
  assert.equal(selectAccounts(store.getState()).length, 2);
  await store.dispatch(updateUserProfile({ userId: 'user-cust-1', updates: { name: 'Aarav Updated' } })).unwrap();
  assert.equal(selectCurrentUser(store.getState()).name, 'Aarav Updated');
  await store.dispatch(saveCustomerAddresses({ customerId: 'user-cust-1', addresses: [{ id: 'a1', label: 'Home', city: 'Bengaluru', pincode: '560103' }] })).unwrap();
  assert.equal(selectCurrentUser(store.getState()).addresses.length, 1);
  await store.dispatch(fetchProviders()).unwrap();
  await store.dispatch(moderateProvider({ providerId: 'user-prov-1', status: 'approved', reason: 'Verified' })).unwrap();
  assert.equal(selectProviders(store.getState())[0].verificationStatus, 'approved');
  await store.dispatch(deleteUserAccount('user-new-1')).unwrap();
  assert.equal(selectAccounts(store.getState()).length, 1);

  // Marketplace CRUD
  await store.dispatch(fetchCategories()).unwrap();
  await store.dispatch(createCategory({ name: 'Carpentry' })).unwrap();
  await store.dispatch(updateCategory({ id: 'cat-9', data: { name: 'Carpentry Pro' } })).unwrap();
  assert.equal(selectCategories(store.getState()).find((c) => c.id === 'cat-9').name, 'Carpentry Pro');
  await store.dispatch(deleteCategory('cat-9')).unwrap();
  assert.equal(selectCategories(store.getState()).length, 1);

  await store.dispatch(fetchServices({})).unwrap();
  await store.dispatch(createService({ title: 'Tap Fix', price: 299 })).unwrap();
  await store.dispatch(updateService({ id: 'srv-99', values: { status: 'paused' } })).unwrap();
  assert.equal(selectServices(store.getState()).find((s) => s.id === 'srv-99').status, 'paused');
  await store.dispatch(deleteService('srv-99')).unwrap();
  assert.equal(selectServices(store.getState()).length, 1);

  await store.dispatch(createJobRequest({ title: 'Custom Fan Install', budget: 500 })).unwrap();
  assert.equal(selectJobRequests(store.getState()).length, 1);

  // Bookings CRUD
  await store.dispatch(fetchAvailableSlots({ serviceId: 'srv-1', date: '2026-12-01' })).unwrap();
  assert.deepEqual(selectSlotsByKey(store.getState())['srv-1::2026-12-01'], ['09:00 AM', '11:30 AM']);
  await store.dispatch(fetchBookings({})).unwrap();
  await store.dispatch(createBooking({ serviceId: 'srv-1', scheduledDate: '2026-12-01', scheduledSlot: '09:00 AM' })).unwrap();
  assert.equal(selectBookings(store.getState()).length, 1);
  await store.dispatch(updateBookingStatus({ bookingId: 'BK-999', status: 'cancelled', note: 'Cancel' })).unwrap();
  assert.equal(selectBookings(store.getState())[0].status, 'cancelled');
  await store.dispatch(deleteBooking('BK-999')).unwrap();
  assert.equal(selectBookings(store.getState()).length, 0);
});

test('financeSlice + governanceSlice + notificationsSlice + platformSlice: full CRUD lifecycle', async () => {
  const store = createAppStore();

  mockHandler = ({ url, method, body }) => {
    if (url.endsWith('/finance/revenue')) return { status: 200, data: { gmv: 2000, totalRevenue: 100 } };
    if (url.endsWith('/finance/ledgers') && method === 'GET') return { status: 200, data: [] };
    if (url.endsWith('/finance/ledgers') && method === 'POST') return { status: 201, data: { id: 'pay-1', ...body } };
    if (url.endsWith('/finance/ledgers/pay-1') && method === 'PATCH') return { status: 200, data: { id: 'pay-1', paymentStatus: body.paymentStatus } };
    if (url.endsWith('/finance/refunds') && method === 'POST') return { status: 200, data: { id: 'pay-1', paymentStatus: 'Refunded', refundedAmountInr: body.amount } };
    if (url.endsWith('/finance/ledgers/pay-1') && method === 'DELETE') return { status: 200, data: { success: true } };

    if (url.includes('/governance/tickets') && method === 'GET') return { status: 200, data: [] };
    if (url.endsWith('/governance/tickets') && method === 'POST') return { status: 201, data: { id: 'TCK-1', ...body, status: 'open' } };
    if (url.endsWith('/governance/tickets/TCK-1/resolve') && method === 'PATCH') return { status: 200, data: { id: 'TCK-1', status: 'resolved', resolutionOutcome: body.outcome } };
    if (url.endsWith('/governance/tickets/TCK-1') && method === 'DELETE') return { status: 200, data: { success: true } };

    if (url.endsWith('/governance/disputes') && method === 'GET') return { status: 200, data: [] };
    if (url.endsWith('/governance/disputes') && method === 'POST') return { status: 201, data: { id: 'DISP-1', ...body, status: 'pending_assignment' } };
    if (url.endsWith('/governance/disputes/DISP-1/assign') && method === 'PATCH') return { status: 200, data: { id: 'DISP-1', status: 'assigned', arbitratorId: body.arbitrator.id } };
    if (url.endsWith('/governance/disputes/DISP-1/ruling') && method === 'PATCH') return { status: 200, data: { id: 'DISP-1', status: 'ruled', ruling: body } };
    if (url.endsWith('/governance/disputes/DISP-1') && method === 'DELETE') return { status: 200, data: { success: true } };
    if (url.endsWith('/governance/arbitrator-applications') && method === 'GET') return { status: 200, data: [{ id: 'app-1', status: 'pending' }] };
    if (url.endsWith('/governance/arbitrator-applications/app-1/approve') && method === 'PATCH') return { status: 200, data: { id: 'app-1', status: 'approved' } };

    if (url.includes('/notifications') && method === 'GET') return { status: 200, data: [] };
    if (url.endsWith('/notifications') && method === 'POST') return { status: 201, data: { id: 'n-1', ...body, read: false } };
    if (url.endsWith('/notifications/read') && method === 'PATCH') return { status: 200, data: [{ id: 'n-1', title: 'Alert', read: true }] };
    if (url.endsWith('/notifications/n-1') && method === 'DELETE') return { status: 200, data: { success: true } };
    if (url.endsWith('/notifications') && method === 'DELETE') return { status: 200, data: { success: true } };

    if (url.endsWith('/platform/stats')) return { status: 200, data: { accounts: 6, bookings: 5 } };
    if (url.includes('/platform/activity-logs') && method === 'GET') return { status: 200, data: [] };
    if (url.endsWith('/platform/activity-logs') && method === 'POST') return { status: 201, data: { id: 'act-1', ...body } };
    if (url.endsWith('/platform/activity-logs/act-1') && method === 'PATCH') return { status: 200, data: { id: 'act-1', description: body.description } };
    if (url.endsWith('/platform/activity-logs/act-1') && method === 'DELETE') return { status: 200, data: { success: true } };
    if (url.endsWith('/platform/reset-demo') && method === 'POST') return { status: 200, data: { success: true, message: 'Demo data reset.' } };
    if (url.endsWith('/finance/wallet') && method === 'GET') {
      return {
        status: 200,
        data: { walletBalance: 5000, transactions: [{ id: 'wtxn-1', type: 'TOP_UP', amount: 5000, balanceAfter: 5000 }] },
      };
    }
    if (url.endsWith('/finance/wallet/topup') && method === 'POST') {
      return {
        status: 201,
        data: {
          walletBalance: 6000,
          transaction: { id: 'wtxn-2', type: 'TOP_UP', amount: body.amount, balanceAfter: 6000 },
        },
      };
    }
    if (url.endsWith('/finance/wallet/withdraw') && method === 'POST') {
      return {
        status: 201,
        data: {
          walletBalance: 5500,
          transaction: { id: 'wtxn-3', type: 'WITHDRAWAL', amount: body.amount, balanceAfter: 5500 },
        },
      };
    }
    return { status: 404, data: { message: `Unhandled ${method} ${url}` } };
  };

  // Finance CRUD
  await store.dispatch(fetchRevenueStats()).unwrap();
  assert.equal(selectRevenueStats(store.getState()).totalRevenue, 100);
  await store.dispatch(fetchWallet()).unwrap();
  assert.equal(selectWalletBalance(store.getState()), 5000);
  await store.dispatch(topUpWallet({ amount: 1000, method: 'UPI' })).unwrap();
  assert.equal(selectWalletBalance(store.getState()), 6000);
  await store.dispatch(withdrawWallet({ amount: 500, destination: 'HDFC Bank' })).unwrap();
  assert.equal(selectWalletBalance(store.getState()), 5500);
  assert.equal(selectWalletTransactions(store.getState()).length, 3);
  await store.dispatch(fetchLedgers()).unwrap();
  await store.dispatch(createLedger({ bookingId: 'BK-1', grossAmountInr: 1000 })).unwrap();
  await store.dispatch(updateLedger({ id: 'pay-1', data: { paymentStatus: 'Paid' } })).unwrap();
  await store.dispatch(issueRefund({ bookingId: 'BK-1', amount: 1000 })).unwrap();
  assert.equal(selectLedgers(store.getState())[0].paymentStatus, 'Refunded');
  await store.dispatch(deleteLedger('pay-1')).unwrap();
  assert.equal(selectLedgers(store.getState()).length, 0);

  // Governance CRUD
  await store.dispatch(fetchTickets({})).unwrap();
  await store.dispatch(createTicket({ bookingId: 'BK-1', description: 'Issue' })).unwrap();
  await store.dispatch(resolveTicket({ ticketId: 'TCK-1', outcome: 'Full Mock Refund Issued' })).unwrap();
  assert.equal(selectTickets(store.getState())[0].status, 'resolved');
  await store.dispatch(deleteTicket('TCK-1')).unwrap();
  assert.equal(selectTickets(store.getState()).length, 0);

  await store.dispatch(fetchDisputes()).unwrap();
  await store.dispatch(createDispute({ bookingId: 'BK-1', claimAmount: 500, customerStatement: 'Broken' })).unwrap();
  await store.dispatch(assignDispute({ disputeId: 'DISP-1', arbitrator: { id: 'user-arbit-1', name: 'Kabir' } })).unwrap();
  await store.dispatch(issueRuling({ disputeId: 'DISP-1', values: { verdict: 'In favour of Customer', awardAmount: 500, reason: 'Confirmed' } })).unwrap();
  assert.equal(selectDisputes(store.getState())[0].status, 'ruled');
  await store.dispatch(deleteDispute('DISP-1')).unwrap();
  assert.equal(selectDisputes(store.getState()).length, 0);

  await store.dispatch(fetchArbitratorApplications()).unwrap();
  await store.dispatch(approveArbitratorApplication('app-1')).unwrap();
  assert.equal(selectArbitratorApplications(store.getState())[0].status, 'approved');

  // Notifications CRUD
  await store.dispatch(fetchNotifications('user-cust-1')).unwrap();
  await store.dispatch(createNotification({ title: 'Alert', message: 'Test' })).unwrap();
  await store.dispatch(markNotificationsRead({ userId: 'user-cust-1', notificationId: 'n-1' })).unwrap();
  assert.equal(selectNotifications(store.getState())[0].read, true);
  await store.dispatch(deleteNotification('n-1')).unwrap();
  assert.equal(selectNotifications(store.getState()).length, 0);
  await store.dispatch(clearNotifications()).unwrap();

  // Platform CRUD
  await store.dispatch(fetchPlatformStats()).unwrap();
  assert.equal(selectPlatformStats(store.getState()).accounts, 6);
  await store.dispatch(fetchActivityLogs()).unwrap();
  await store.dispatch(createActivityLog({ description: 'Audit event' })).unwrap();
  await store.dispatch(updateActivityLog({ id: 'act-1', description: 'Audit updated' })).unwrap();
  assert.equal(selectActivityLogs(store.getState())[0].description, 'Audit updated');
  await store.dispatch(deleteActivityLog('act-1')).unwrap();
  assert.equal(selectActivityLogs(store.getState()).length, 0);
  await store.dispatch(resetDemoData()).unwrap();
});
