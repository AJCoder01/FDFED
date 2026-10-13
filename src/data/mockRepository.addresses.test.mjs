import assert from 'node:assert/strict';
import { after, beforeEach, test } from 'node:test';
import { createServer } from 'vite';

const server = await createServer({ server: { middlewareMode: true, ws: false } });
const repository = await server.ssrLoadModule('/src/data/mockRepository.js');
const customerId = 'user-cust-1';

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

test('customer addresses persist, can be edited, and keep one default', async () => {
  const customer = await repository.getCustomerById(customerId);
  const home = customer.addresses[0];
  const work = customer.addresses[1];
  assert.equal(home.isDefault, true);

  await repository.saveCustomerAddresses(customerId, [
    { ...home, isDefault: false },
    { ...work, isDefault: false },
    { id: 'addr-new', label: 'Other', addressLine: '12 Lake Road', city: 'Mysuru', pincode: '570001', isDefault: true }
  ]);

  let updated = await repository.getCustomerById(customerId);
  assert.equal(updated.addresses[2].isDefault, true);
  assert.equal(updated.addresses.filter(address => address.isDefault).length, 1);

  await repository.saveCustomerAddresses(customerId, [
    { ...updated.addresses[0], addressLine: 'Updated home address', isDefault: true },
    updated.addresses[2]
  ]);
  updated = await repository.getCustomerById(customerId);
  assert.equal(updated.addresses[0].addressLine, 'Updated home address');
  assert.equal(updated.addresses.filter(address => address.isDefault).length, 1);
});

test('customer address validation rejects incomplete or invalid PIN codes', async () => {
  await assert.rejects(
    repository.saveCustomerAddresses(customerId, [
      { id: 'bad-address', label: 'Home', addressLine: '12 Lake Road', city: 'Mysuru', pincode: '57001' }
    ]),
    /6-digit PIN code/
  );
});
