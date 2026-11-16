import assert from 'node:assert/strict';
import {after,beforeEach,test} from 'node:test';
import {createServer} from 'vite';
const server=await createServer({server:{middlewareMode:true,ws:false}});
globalThis.window=new EventTarget();
const repo=await server.ssrLoadModule('/src/data/apiRepository.js');
const client=await server.ssrLoadModule('/src/data/apiClient.js');
const originalFetch=globalThis.fetch;
let calls=[];
beforeEach(()=>{calls=[];client.setSession({accessToken:'access',user:{id:'customer',role:'customer'}});globalThis.fetch=async(url,options)=>{calls.push({url,options});return new Response(JSON.stringify({id:'result'}),{status:200,headers:{'Content-Type':'application/json'}});};});
after(async()=>{globalThis.fetch=originalFetch;delete globalThis.window;await server.close();});
test('booking adapter sends only the booking inputs, never actor identities',async()=>{await repo.createBooking({serviceId:'srv-1',customerId:'forged',providerId:'forged',role:'admin',scheduledDate:'2027-01-01',scheduledSlot:'09:00 AM',address:'12 Main Street',paymentMethod:'Cash After Service',amount:799});const payload=JSON.parse(calls[0].options.body);assert.equal(payload.customerId,undefined);assert.equal(payload.providerId,undefined);assert.equal(payload.role,undefined);assert.equal(calls[0].options.headers.Authorization,'Bearer access');});
test('address adapter removes database owner IDs before validation',async()=>{await repo.saveCustomerAddresses('forged',[{id:'addr',userId:'private',label:'Home',addressLine:'12 Road',city:'Bengaluru',pincode:'560001',isDefault:true}]);assert.equal(JSON.parse(calls[0].options.body).addresses[0].userId,undefined);assert.match(calls[0].url,/customers\/me\/addresses$/);});
test('failed API requests surface errors without substituting mock records',async()=>{globalThis.fetch=async()=>new Response(JSON.stringify({message:'Database unavailable'}),{status:503});await assert.rejects(repo.getBookings('admin','fake'),/Database unavailable/);});
test('collection adapter retrieves every page for existing dashboard shapes',async()=>{globalThis.fetch=async(url)=>new Response(JSON.stringify(String(url).includes('page=1')?{items:[{id:1}],total:2}:{items:[{id:2}],total:2}));assert.deepEqual(await repo.getBookings(),[{id:1},{id:2}]);});
test('cancellation endpoint follows authenticated role, ignoring caller role',async()=>{await repo.updateBookingStatus('bk','cancelled','Reason',{role:'provider',userId:'forged'});assert.match(calls[0].url,/bookings\/bk\/cancel$/);});
test('logout uses its HttpOnly cookie without sending an expired access token', async()=>{await repo.logoutUser();assert.equal(calls[0].options.headers.Authorization,undefined);assert.equal(calls[0].options.credentials,'include');});
test('simultaneous session restorations share one rotating-cookie request', async () => {
  let finish;
  globalThis.fetch = (url, options) => {
    calls.push({ url, options });
    return new Promise(resolve => { finish = resolve; });
  };
  const first = client.refreshSession();
  const second = client.refreshSession();
  assert.equal(calls.length, 1);
  assert.equal(calls[0].options.keepalive, true);
  const user = { id: 'restored-user', role: 'customer' };
  finish(new Response(JSON.stringify({ user, accessToken: 'rotated-token' }), { status: 200 }));
  assert.deepEqual(await Promise.all([first, second]), [user, user]);
  assert.deepEqual(client.authenticatedUser, user);
});
test('restoration retries a stale cookie while a preceding page finishes rotation', async () => {
  let attempts = 0;
  const user = { id: 'rotated-user', role: 'customer' };
  globalThis.fetch = async () => ++attempts === 1
    ? new Response('{}', { status: 401 })
    : new Response(JSON.stringify({ user, accessToken: 'fresh-token' }), { status: 201 });
  assert.deepEqual(await client.refreshSession(), user);
  assert.equal(attempts, 2);
});
test('an invalid refresh cookie stops after bounded retries and clears the session', async () => {
  let attempts = 0;
  globalThis.fetch = async () => { attempts++; return new Response('{}', { status: 401 }); };
  assert.equal(await client.refreshSession(), null);
  assert.equal(attempts, 3);
  assert.equal(client.authenticatedUser, null);
});
test('a stale restoration cannot clear a session established by a later login', async () => {
  let finish;
  globalThis.fetch = () => new Promise(resolve => { finish = resolve; });
  const restoring = client.refreshSession();
  const user = { id: 'new-login', role: 'provider' };
  client.setSession({ user, accessToken: 'new-login-token' });
  finish(new Response('{}', { status: 401 }));
  assert.deepEqual(await restoring, user);
  assert.deepEqual(client.authenticatedUser, user);
});
