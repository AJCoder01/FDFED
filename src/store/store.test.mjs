import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'vite';

test('Redux store and slices comprehensive evaluation', async () => {
  const server = await createServer({ server: { middlewareMode: true, ws: false } });
  globalThis.window = new EventTarget();

  try {
    const { store } = await server.ssrLoadModule('/src/store/index.js');
    const {
      selectCurrentUser,
      selectCurrentRole,
      selectIsAuthenticated,
    } = await server.ssrLoadModule('/src/store/slices/authSlice.js');
    const {
      selectServices,
      selectCategories,
    } = await server.ssrLoadModule('/src/store/slices/marketplaceSlice.js');
    const {
      selectBookings,
    } = await server.ssrLoadModule('/src/store/slices/bookingsSlice.js');
    const {
      selectRevenueStats,
    } = await server.ssrLoadModule('/src/store/slices/financeSlice.js');
    const {
      selectTickets,
      selectDisputes,
    } = await server.ssrLoadModule('/src/store/slices/supportSlice.js');
    const {
      selectProviders,
    } = await server.ssrLoadModule('/src/store/slices/usersSlice.js');
    const {
      selectNotifications,
      selectAccounts,
    } = await server.ssrLoadModule('/src/store/slices/platformSlice.js');

    // 1. Verify store initialization with all 8 slices
    const state = store.getState();
    assert.ok(state.auth, 'auth slice exists');
    assert.ok(state.users, 'users slice exists');
    assert.ok(state.marketplace, 'marketplace slice exists');
    assert.ok(state.bookings, 'bookings slice exists');
    assert.ok(state.finance, 'finance slice exists');
    assert.ok(state.support, 'support slice exists');
    assert.ok(state.platform, 'platform slice exists');
    assert.ok(state.files, 'files slice exists');

    // 2. Verify initial selectors and state shapes
    assert.equal(selectIsAuthenticated(state), false);
    assert.equal(selectCurrentRole(state), 'guest');
    assert.equal(selectCurrentUser(state), null);
    assert.deepEqual(selectServices(state), []);
    assert.deepEqual(selectCategories(state), []);
    assert.deepEqual(selectBookings(state), []);
    assert.deepEqual(selectRevenueStats(state), { totalRevenue: 0, gmv: 0, netPayouts: 0 });
    assert.deepEqual(selectTickets(state), []);
    assert.deepEqual(selectDisputes(state), []);
    assert.deepEqual(selectProviders(state), []);
    assert.deepEqual(selectNotifications(state), []);
    assert.deepEqual(selectAccounts(state), []);

    // 3. Pessimistic update verification: rejected action does not mutate entities
    const stateBefore = store.getState().marketplace.services;
    store.dispatch({
      type: 'marketplace/saveService/rejected',
      payload: 'Network failure or 400 Bad Request'
    });
    const stateAfterReject = store.getState();
    assert.deepEqual(stateAfterReject.marketplace.services, stateBefore, 'Services entity array unchanged on error');
    assert.equal(stateAfterReject.marketplace.error, 'Network failure or 400 Bad Request', 'Error state recorded');

    // 4. Pessimistic update verification: fulfilled action (CRUD Create) updates Redux
    const mockService = {
      id: 'srv-test-101',
      title: 'Deep House Spring Cleaning',
      price: 1499,
      status: 'published'
    };
    store.dispatch({
      type: 'marketplace/saveService/fulfilled',
      payload: mockService
    });
    const stateAfterCreate = store.getState();
    const created = stateAfterCreate.marketplace.services.find(s => s.id === 'srv-test-101');
    assert.ok(created, 'New service added to entity store after fulfilled confirmation');
    assert.equal(created.title, 'Deep House Spring Cleaning');
    assert.equal(stateAfterCreate.marketplace.error, null);

    // 5. CRUD Update
    store.dispatch({
      type: 'marketplace/saveService/fulfilled',
      payload: { ...mockService, price: 1799 }
    });
    const stateAfterUpdate = store.getState();
    const updated = stateAfterUpdate.marketplace.services.find(s => s.id === 'srv-test-101');
    assert.equal(updated.price, 1799, 'Updated service price reflected after fulfilled confirmation');

    // 6. CRUD Delete
    store.dispatch({
      type: 'marketplace/deleteService/fulfilled',
      payload: 'srv-test-101'
    });
    const stateAfterDelete = store.getState();
    assert.equal(
      stateAfterDelete.marketplace.services.some(s => s.id === 'srv-test-101'),
      false,
      'Deleted service removed from entity store after fulfilled confirmation'
    );

    // 7. Cross-slice synchronization on logout
    store.dispatch({
      type: 'platform/fetchNotifications/fulfilled',
      payload: [{ id: 'notif-1', title: 'Booking Confirmed' }]
    });
    store.dispatch({
      type: 'bookings/fetchBookings/fulfilled',
      payload: [{ id: 'bk-1', serviceTitle: 'Carpentry' }]
    });
    assert.equal(store.getState().platform.notifications.length, 1);
    assert.equal(store.getState().bookings.items.length, 1);

    store.dispatch({
      type: 'auth/logout/fulfilled'
    });
    const stateAfterLogout = store.getState();
    assert.equal(selectIsAuthenticated(stateAfterLogout), false);
    assert.equal(stateAfterLogout.auth.user, null);
    assert.equal(selectCurrentRole(stateAfterLogout), 'guest');
    assert.deepEqual(stateAfterLogout.platform.notifications, []);
    assert.deepEqual(stateAfterLogout.bookings.items, []);
  } finally {
    delete globalThis.window;
    await server.close();
  }
});
