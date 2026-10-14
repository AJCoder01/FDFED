import assert from 'node:assert/strict';
import { after, beforeEach, test } from 'node:test';
import { createServer } from 'vite';

const server = await createServer({ server: { middlewareMode: true, ws: false } });
const repository = await server.ssrLoadModule('/src/data/mockRepository.js');
const { DEFAULT_BLANK_AVATAR } = await server.ssrLoadModule('/src/data/mockData.js');

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

test('Others category exists and services can be found under it', async () => {
  const categories = await repository.getCategories();
  const othersCat = categories.find(c => c.name === 'Others' || c.slug === 'others');
  assert.ok(othersCat, 'Others category must be present in categories');

  const services = await repository.getServices({ category: othersCat.id });
  assert.ok(services.length > 0, 'Should have at least 1 service under Others category');
});

test('Search filtering matches title, categoryName, or description', async () => {
  // Search by categoryName
  const byCategory = await repository.getServices({ search: 'Others' });
  assert.ok(byCategory.length > 0, 'Search should match category name "Others"');

  // Search by description keyword
  const byDesc = await repository.getServices({ search: 'handyman' });
  assert.ok(byDesc.length > 0, 'Search should match description keyword "handyman"');

  // Search by title keyword
  const byTitle = await repository.getServices({ search: 'General Handyman' });
  assert.ok(byTitle.length > 0, 'Search should match title "General Handyman"');
});

test('updateUserProfile updates profile details and syncs properly', async () => {
  // Create a customer
  const newCust = await repository.signUpUser({
    role: 'customer',
    name: 'Test Customer',
    email: 'test.update.cust@servicehub.in',
    phone: '+91 91111 22222',
    password: 'Password@123'
  });

  assert.equal(newCust.avatar, DEFAULT_BLANK_AVATAR);

  // Update customer name and avatar
  await repository.updateUserProfile(newCust.id, {
    name: 'Updated Customer Name',
    phone: '+91 99999 00000',
    avatar: 'https://example.com/custom-avatar.png'
  });

  const updatedProfile = await repository.getUserProfile(newCust.id);
  assert.equal(updatedProfile.name, 'Updated Customer Name');
  assert.equal(updatedProfile.phone, '+91 99999 00000');
  assert.equal(updatedProfile.avatar, 'https://example.com/custom-avatar.png');
});

test('saveProvider updates contact name, phone, and avatar', async () => {
  const provider = await repository.authenticateUser('rohan@gmail.com', '123456Ab@', 'provider');
  await repository.saveProvider(provider.id, {
    name: 'Rohan V. Sharma',
    phone: '+91 98888 12345',
    avatar: 'https://example.com/provider-avatar.png',
    businessName: 'Rohan Premier Repairs',
    serviceArea: 'Bengaluru South',
    skills: ['Electronics', 'Others'],
    documentName: 'doc-verify.pdf'
  }, false);

  const updated = await repository.getUserProfile(provider.id);
  assert.equal(updated.name, 'Rohan V. Sharma');
  assert.equal(updated.phone, '+91 98888 12345');
  assert.equal(updated.avatar, 'https://example.com/provider-avatar.png');
  assert.equal(updated.businessName, 'Rohan Premier Repairs');
});
