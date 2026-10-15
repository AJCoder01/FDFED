import assert from 'node:assert/strict';
import { after, beforeEach, test } from 'node:test';
import { createServer } from 'vite';

const server = await createServer({ server: { middlewareMode: true, ws: false } });
const repository = await server.ssrLoadModule('/src/data/mockRepository.js');

beforeEach(() => {
  const storage = new Map();
  globalThis.localStorage = {
    getItem: key => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, String(value)),
    removeItem: key => storage.delete(key)
  };
});

after(async () => {
  await server.close();
  delete globalThis.localStorage;
});

test('authenticateUser succeeds with demo credentials for all actors', async () => {
  const customer = await repository.authenticateUser('aarav@gmail.com', '123456Ab@', 'customer');
  assert.equal(customer.name, 'Aarav Mehta');
  assert.equal(customer.role, 'customer');

  const provider = await repository.authenticateUser('rohan@gmail.com', '123456Ab@', 'provider');
  assert.equal(provider.name, 'Rohan Verma');
  assert.equal(provider.role, 'provider');

  const admin = await repository.authenticateUser('admin@gmail.com', '123456Ab@', 'admin');
  assert.equal(admin.name, 'Naina Kapoor');
  assert.equal(admin.role, 'admin');
  assert.equal(admin.isSuperUser, true);

  const staffAdmin = await repository.authenticateUser('staffadmin@gmail.com', '123456Ab@', 'admin');
  assert.equal(staffAdmin.name, 'Priya Nair');
  assert.equal(staffAdmin.role, 'admin');
  assert.equal(staffAdmin.isSuperUser, false);

  const arbitrator = await repository.authenticateUser('kabir@gmail.com', '123456Ab@', 'arbitrator');
  assert.equal(arbitrator.name, 'Kabir Malhotra');
  assert.equal(arbitrator.role, 'arbitrator');
});

test('authenticateUser rejects incorrect credentials and mismatched roles', async () => {
  await assert.rejects(
    repository.authenticateUser('aarav@gmail.com', 'WrongPass123', 'customer'),
    /Incorrect password/
  );

  await assert.rejects(
    repository.authenticateUser('nonexistent@gmail.com', '123456Ab@', 'customer'),
    /No account found/
  );

  await assert.rejects(
    repository.authenticateUser('aarav@gmail.com', '123456Ab@', 'provider'),
    /registered as a CUSTOMER/
  );
});

test('signUpUser registers new actors and allows immediate login with new credentials', async () => {
  const newCustomer = await repository.signUpUser({
    name: 'Devi Sharma',
    email: 'devi@example.com',
    password: 'SecurePass456!',
    role: 'customer',
    phone: '+91 98888 77777',
    addressLine: 'Flat 502, Green View',
    city: 'Bengaluru',
    pincode: '560034'
  });

  assert.equal(newCustomer.name, 'Devi Sharma');
  assert.equal(newCustomer.email, 'devi@example.com');
  assert.equal(newCustomer.role, 'customer');

  // Verify in customers store
  const storedCustomer = await repository.getCustomerById(newCustomer.id);
  assert.ok(storedCustomer);
  assert.equal(storedCustomer.addresses[0].addressLine, 'Flat 502, Green View');

  // Verify logging in with newly registered credentials
  const loggedIn = await repository.authenticateUser('devi@example.com', 'SecurePass456!', 'customer');
  assert.equal(loggedIn.id, newCustomer.id);
  assert.equal(loggedIn.email, 'devi@example.com');

  // Verify duplicate email is rejected
  await assert.rejects(
    repository.signUpUser({
      name: 'Duplicate Devi',
      email: 'devi@example.com',
      password: 'AnotherPassword',
      role: 'customer',
      phone: '+91 98888 77777'
    }),
    /already exists/
  );
});

test('signUpUser registers provider, arbitrator, and admin actors', async () => {
  const newProvider = await repository.signUpUser({
    name: 'Suresh Patel',
    email: 'suresh@electric.com',
    password: 'Password999!',
    role: 'provider',
    phone: '+91 97777 66666',
    businessName: 'Patel Electrical Solutions',
    skill: 'Electrical Repair',
    serviceArea: 'Bengaluru East'
  });

  assert.equal(newProvider.role, 'provider');
  const storedProvider = await repository.getProviderById(newProvider.id);
  assert.ok(storedProvider);
  assert.equal(storedProvider.businessName, 'Patel Electrical Solutions');

  const newAdmin = await repository.signUpUser({
    name: 'Vikram Seth',
    email: 'vikram@admin.com',
    password: 'AdminPassword888!',
    role: 'admin',
    phone: '+91 96666 55555',
    department: 'Marketplace Operations'
  });
  assert.equal(newAdmin.role, 'admin');

  const newArbitrator = await repository.signUpUser({
    name: 'Justice Mehra',
    email: 'mehra@arbit.com',
    password: 'ArbitPassword777!',
    role: 'arbitrator',
    phone: '+91 95555 44444',
    title: 'Senior Advocate & Arbitrator'
  });
  assert.equal(newArbitrator.role, 'arbitrator');
});

test('activities are logged for signup, login, and logout in activity_log', async () => {
  await repository.signUpUser({
    name: 'Anita Roy',
    email: 'anita@example.com',
    password: 'RoyPassword123!',
    role: 'customer',
    phone: '+91 91111 22222'
  });

  await repository.authenticateUser('anita@example.com', 'RoyPassword123!', 'customer');

  await repository.logActivity({
    userId: 'user-test',
    userEmail: 'anita@example.com',
    userName: 'Anita Roy',
    role: 'customer',
    type: 'LOGOUT',
    description: 'User signed out'
  });

  const logs = await repository.getActivityLogs();
  assert.ok(logs.length >= 3);
  assert.ok(logs.some(log => log.type === 'SIGNUP' && log.userEmail === 'anita@example.com'));
  assert.ok(logs.some(log => log.type === 'LOGIN' && log.userEmail === 'anita@example.com'));
  assert.ok(logs.some(log => log.type === 'LOGOUT' && log.userEmail === 'anita@example.com'));
});

test('provider mock profile has UrbanFix Home Solutions and simple Bengaluru serviceArea', async () => {
  const provider = await repository.getProviderById('user-prov-1');
  assert.equal(provider.businessName, 'UrbanFix Home Solutions');
  assert.equal(provider.serviceArea, 'Bengaluru');
});

test('arbitrator mock disputes are standardized and coherent', async () => {
  const disputes = await repository.getDisputes();
  const d101 = disputes.find(d => d.id === 'DISP-101');
  assert.ok(d101);
  assert.equal(d101.status, 'hearing_scheduled');
  assert.equal(d101.arbitratorId, 'user-arbit-1');
  assert.equal(d101.arbitratorName, 'Kabir Malhotra');
  assert.equal(d101.providerName, 'UrbanFix Home Solutions');
  assert.equal(d101.customerName, 'Aarav Mehta');
  assert.equal(d101.hearingSchedule.scheduledDate, '2026-08-22');
  assert.equal(d101.hearingSchedule.scheduledTime, '11:00 AM');

  const d102 = disputes.find(d => d.id === 'DISP-102');
  assert.ok(d102);
  assert.equal(d102.status, 'ruled');
  assert.equal(d102.arbitratorId, 'user-arbit-1');
  assert.ok(d102.ruling);
  assert.equal(d102.ruling.verdict, 'In favour of Customer');

  const d103 = disputes.find(d => d.id === 'DISP-103');
  assert.ok(d103);
  assert.equal(d103.status, 'pending_assignment');
  assert.equal(d103.arbitratorId, null);
});
