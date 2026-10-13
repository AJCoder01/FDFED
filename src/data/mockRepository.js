import { INITIAL_CATEGORIES, INITIAL_SERVICES, INITIAL_BOOKINGS, INITIAL_TICKETS, INITIAL_DISPUTES, INITIAL_NOTIFICATIONS, DEMO_USERS } from './mockData';
import { availableSlots, DEFAULT_SCHEDULE, validateSchedule, validateSlots, validDate, localClock, slotMinutes } from './scheduling';
import { isAccepted, isPending, isPaid, platformFee, netPayout, collectedAmount, refundPayment } from './bookingRules';
import { DATA_CHANGED } from './repositoryEvents';

const seeds = {
  services: INITIAL_SERVICES, bookings: INITIAL_BOOKINGS, tickets: INITIAL_TICKETS,
  disputes: INITIAL_DISPUTES, notifications: INITIAL_NOTIFICATIONS, categories: INITIAL_CATEGORIES,
  customers: [DEMO_USERS.customer]
};
const key = name => `servicehub_${name}`;
const read = name => JSON.parse(localStorage.getItem(key(name)));
const stamp = () => new Date().toISOString();
const id = prefix => `${prefix}-${crypto.randomUUID().slice(0, 8)}`;
const delay = () => new Promise(resolve => setTimeout(resolve, 150));

function initializeStorage() {
  for (const [name, value] of Object.entries(seeds)) {
    if (!localStorage.getItem(key(name))) localStorage.setItem(key(name), JSON.stringify(value));
  }
  if (!localStorage.getItem(key('providers'))) localStorage.setItem(key('providers'), JSON.stringify(initialProviders(read('services'), read('bookings'))));
}

function initialProviders(services, bookings) {
  const profiles = [{ ...DEMO_USERS.provider, weeklyAvailability: { ...DEFAULT_SCHEDULE, ...DEMO_USERS.provider.weeklyAvailability } }];
  for (const service of services) {
    if (profiles.some(profile => profile.id === service.providerId)) continue;
    const booking = bookings.find(job => job.providerId === service.providerId);
    profiles.push({
      id: service.providerId, role: 'provider', name: service.providerName, businessName: service.providerName,
      phone: booking?.providerPhone || '', email: '', serviceArea: '', verificationStatus: 'approved',
      skills: services.filter(item => item.providerId === service.providerId).map(item => item.categoryName),
      weeklyAvailability: { ...DEFAULT_SCHEDULE }
    });
  }
  return profiles;
}

function save(changes) {
  const previous = Object.fromEntries(Object.keys(changes).map(name => [name, localStorage.getItem(key(name))]));
  try {
    for (const [name, value] of Object.entries(changes)) localStorage.setItem(key(name), JSON.stringify(value));
  } catch (error) {
    for (const [name, value] of Object.entries(previous)) {
      if (value === null) localStorage.removeItem(key(name));
      else localStorage.setItem(key(name), value);
    }
    throw error;
  }
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(DATA_CHANGED));
}

async function change(callback) {
  initializeStorage();
  await delay();
  // A single browser lock keeps bookings and proposals consistent across tabs.
  if (typeof window !== 'undefined' && navigator.locks) return navigator.locks.request('servicehub-data', async () => callback());
  return callback();
}
async function load(name) {
  initializeStorage();
  await delay();
  return read(name);
}
function requireRecord(list, recordId, label) {
  const record = list.find(item => item.id === recordId);
  if (!record) throw new Error(`${label} not found.`);
  return record;
}
function checkOwner(record, actor, field) {
  if (actor.userId && actor.role !== 'admin' && record[field] !== actor.userId) throw new Error('This record does not belong to your account.');
}
function event(job, title, desc) {
  job.timeline = [...(job.timeline || []), { time: stamp(), title, desc }];
}
function notify(list, targets, title, message) {
  for (const [userId, targetLink] of targets) {
    list.unshift({ id: id('notif'), userId, targetLink, title, message, read: false, createdAt: stamp() });
  }
}
const parties = job => [[job.providerId, `/provider/jobs/${job.id}`], [job.customerId, `/customer/bookings/${job.id}`]];
function ratings(service, bookings) {
  const reviews = bookings.filter(job => job.serviceId === service.id && job.reviewSubmitted);
  return { ...service, reviewCount: reviews.length, rating: reviews.length ? reviews.reduce((sum, job) => sum + Number(job.reviewRating), 0) / reviews.length : null };
}
function visible(service, providers) {
  return service.status === 'published' && providers.some(profile => profile.id === service.providerId && profile.verificationStatus === 'approved');
}

export async function resetDemoData() {
  return change(() => {
    save({ ...seeds, providers: initialProviders(INITIAL_SERVICES, INITIAL_BOOKINGS) });
    return { success: true, message: 'Demo data reset.' };
  });
}
export const getCategories = () => load('categories');
export const getProviders = () => load('providers');
export async function getProviderById(providerId) {
  return (await getProviders()).find(profile => profile.id === providerId) || null;
}
export async function getCustomerById(customerId) {
  return (await load('customers')).find(profile => profile.id === customerId) || null;
}
export async function saveCustomerAddresses(customerId, addresses) {
  return change(() => {
    const customers = read('customers');
    const customer = requireRecord(customers, customerId, 'Customer');
    if (!Array.isArray(addresses)) throw new Error('Provide a valid address list.');

    const seenIds = new Set();
    const validatedAddresses = addresses.map(address => {
      const label = address.label?.trim();
      const addressLine = address.addressLine?.trim();
      const city = address.city?.trim();
      const pincode = address.pincode?.trim();
      if (!address.id || seenIds.has(address.id) || !['Home', 'Work', 'Other'].includes(label) || !addressLine || !city || !/^\d{6}$/.test(pincode)) {
        throw new Error('Enter a valid address label, street address, city, and 6-digit PIN code.');
      }
      seenIds.add(address.id);
      return { id: address.id, label, addressLine, city, pincode, isDefault: Boolean(address.isDefault) };
    });
    if (validatedAddresses.length && !validatedAddresses.some(address => address.isDefault)) validatedAddresses[0].isDefault = true;
    let defaultAssigned = false;
    for (const address of validatedAddresses) {
      if (address.isDefault && !defaultAssigned) defaultAssigned = true;
      else address.isDefault = false;
    }
    customer.addresses = validatedAddresses;
    save({ customers });
    return customer;
  });
}
export async function saveProvider(providerId, values, submit = false) {
  return change(() => {
    const profiles = read('providers');
    const profile = requireRecord(profiles, providerId, 'Provider');
    const businessName = values.businessName?.trim();
    const serviceArea = values.serviceArea?.trim();
    if (!businessName || !serviceArea || !values.skills?.length) throw new Error('Enter a business name, coverage area, and at least one skill.');
    if (submit && !values.documentName?.trim()) throw new Error('Enter a document filename before submitting for verification.');
    Object.assign(profile, {
      businessName, serviceArea, skills: [...new Set(values.skills)],
      documentName: values.documentName?.trim() || '',
      verificationStatus: submit ? 'submitted' : profile.verificationStatus
    });
    if (submit) profile.verificationFeedback = 'Submitted for Admin review.';
    const services = read('services').map(service => service.providerId === providerId ? { ...service, providerName: businessName } : service);
    const notifications = read('notifications');
    if (submit) notify(notifications, [['user-admin-1', '/admin/providers']], 'Provider Verification Submitted', `${businessName} submitted a verification profile.`);
    save({ providers: profiles, services, notifications });
    return profile;
  });
}
export async function moderateProvider(providerId, status, reason) {
  return change(() => {
    if (!['approved', 'rejected', 'changes_requested', 'suspended'].includes(status) || !reason.trim()) throw new Error('Choose a valid decision and enter an audit reason.');
    const profiles = read('providers');
    const profile = requireRecord(profiles, providerId, 'Provider');
    profile.verificationStatus = status;
    profile.verificationFeedback = reason.trim();
    const notifications = read('notifications');
    notify(notifications, [[providerId, '/provider/profile']], 'Verification Updated', `${status.replaceAll('_', ' ')}: ${reason.trim()}`);
    save({ providers: profiles, notifications });
    return profile;
  });
}
export async function saveAvailability(providerId, schedule) {
  return change(() => {
    const error = validateSchedule(schedule);
    if (error) throw new Error(error);
    const profiles = read('providers');
    const profile = requireRecord(profiles, providerId, 'Provider');
    profile.weeklyAvailability = { ...DEFAULT_SCHEDULE, ...schedule, days: [...new Set(schedule.days)], blackoutDates: [...new Set(schedule.blackoutDates)].sort() };
    save({ providers: profiles });
    return profile;
  });
}

export async function getServices(filters = {}) {
  let services = await load('services');
  const providers = read('providers');
  if (filters.role === 'provider') services = services.filter(service => service.providerId === filters.userId);
  else if (filters.role !== 'admin') services = services.filter(service => visible(service, providers));
  if (filters.category) services = services.filter(service => service.categoryId === filters.category || service.categoryName === filters.category);
  if (filters.search) services = services.filter(service => `${service.title} ${service.description}`.toLowerCase().includes(filters.search.toLowerCase()));
  if (filters.maxPrice) services = services.filter(service => service.price <= Number(filters.maxPrice));
  const bookings = read('bookings');
  services = services.map(service => ratings(service, bookings));
  if (filters.sort === 'price_low') services.sort((a, b) => a.price - b.price);
  if (filters.sort === 'price_high') services.sort((a, b) => b.price - a.price);
  if (filters.sort === 'rating') services.sort((a, b) => (b.rating || 0) - (a.rating || 0));
  return services;
}
export async function getServiceById(serviceId, actor = {}) {
  const services = await load('services');
  const service = services.find(item => item.id === serviceId);
  if (!service) return null;
  const own = actor.role === 'provider' && actor.userId === service.providerId;
  if (!own && actor.role !== 'admin' && !visible(service, read('providers'))) return null;
  return { ...ratings(service, read('bookings')), providerVerificationStatus: read('providers').find(profile => profile.id === service.providerId)?.verificationStatus };
}
export async function saveService(values, actor = {}) {
  return change(() => {
    const services = read('services');
    const existing = values.id ? requireRecord(services, values.id, 'Listing') : null;
    const service = { rating: null, reviewCount: 0, status: 'published', ...existing, ...values };
    checkOwner(service, actor, 'providerId');
    const provider = requireRecord(read('providers'), service.providerId, 'Provider');
    if (!['draft', 'published', 'paused', 'archived'].includes(service.status)) throw new Error('Invalid listing status.');
    if (service.status === 'published' && provider.verificationStatus !== 'approved') throw new Error('An approved provider profile is required to publish.');
    if (!service.title?.trim() || !service.description?.trim() || !service.policy?.trim() || !read('categories').some(category => category.id === service.categoryId)) throw new Error('Enter a title, category, description, and cancellation policy.');
    if (!Number.isFinite(Number(service.price)) || Number(service.price) <= 0) throw new Error('Enter a positive service price.');
    const duration = Number.parseInt(service.duration, 10);
    const error = validateSlots(service.availableSlots || [], duration);
    if (error && service.status !== 'draft') throw new Error(error);
    if (!Number.isInteger(duration) || duration <= 0 || duration > 1440) throw new Error('Enter a valid duration.');
    Object.assign(service, { id: existing?.id || id('srv'), title: service.title.trim(), description: service.description.trim(), price: Number(service.price), providerName: provider.businessName });
    if (existing) services[services.indexOf(existing)] = service;
    else services.unshift(service);
    save({ services });
    return { success: true, service };
  });
}
export async function getAvailableSlots(serviceId, date, excludeId) {
  const services = await load('services');
  const service = services.find(item => item.id === serviceId);
  const provider = read('providers').find(profile => profile.id === service?.providerId);
  return availableSlots(service, provider, date, read('bookings'), services, excludeId);
}

export async function getBookings(role, userId) {
  const bookings = await load('bookings');
  if (role === 'customer') return bookings.filter(job => job.customerId === userId);
  if (role === 'provider') return bookings.filter(job => job.providerId === userId);
  return bookings;
}
export async function getBookingById(bookingId) {
  return (await load('bookings')).find(job => job.id === bookingId) || null;
}
export async function createBooking(values) {
  return change(() => {
    const bookings = read('bookings');
    const services = read('services');
    const service = requireRecord(services, values.serviceId, 'Service');
    const provider = requireRecord(read('providers'), service.providerId, 'Provider');
    if (!availableSlots(service, provider, values.scheduledDate, bookings, services).includes(values.scheduledSlot)) throw new Error('This time is unavailable. Choose another available slot.');
    if (!values.customerId || !values.customerName?.trim() || !values.address?.trim()) throw new Error('Enter the customer details and service address.');
    if (values.amount !== undefined && Number(values.amount) !== Number(service.price)) throw new Error('The service price changed. Review the listing before booking.');
    const amount = Number(service.price);
    const cash = values.paymentMethod === 'Cash After Service';
    const job = {
      ...values, id: id('BK'), serviceTitle: service.title, categoryName: service.categoryName,
      providerId: provider.id, providerName: provider.businessName, providerPhone: provider.phone,
      duration: service.duration, amount, platformFee: Math.round(amount * 0.05),
      netPayout: amount - Math.round(amount * 0.05), paymentStatus: cash ? 'Pending' : 'Paid',
      status: 'active', createdAt: stamp(), acceptedAt: null, refundedAmount: 0, timeline: []
    };
    event(job, 'Booking Requested', cash ? 'Cash payment is due after service.' : `Mock payment of ₹${amount} recorded.`);
    event(job, 'Assigned to Provider', `${provider.businessName} received the request.`);
    bookings.unshift(job);
    const notifications = read('notifications');
    notify(notifications, [[provider.id, `/provider/jobs/${job.id}`], ['user-admin-1', '/admin/bookings']], 'New Job Request', `${job.customerName} booked ${job.serviceTitle} for ${job.scheduledDate} at ${job.scheduledSlot}. Payment: ${job.paymentStatus}.`);
    save({ bookings, notifications });
    return job;
  });
}
export async function updateBookingStatus(bookingId, status, note = '', actor = {}) {
  return change(() => {
    const bookings = read('bookings');
    const job = requireRecord(bookings, bookingId, 'Booking');
    if (actor.role === 'provider') checkOwner(job, actor, 'providerId');
    if (actor.role === 'customer') {
      checkOwner(job, actor, 'customerId');
      if (status !== 'cancelled') throw new Error('Customers can only cancel through this action.');
    }
    if (actor.role === 'provider' && status === 'cancelled' && !isPending(job)) throw new Error('Only pending requests can be declined.');
    if (actor.expectedStatus && job.status !== actor.expectedStatus) throw new Error('This booking has changed. Refresh before acting.');
    const allowed = {
      active: job.status === 'active' && !isAccepted(job),
      in_progress: job.status === 'active' && isAccepted(job),
      completed: job.status === 'in_progress',
      cancelled: ['active', 'in_progress', 'reschedule_proposed'].includes(job.status)
    };
    if (!allowed[status]) throw new Error('This booking has changed or the action is not allowed.');
    if (status === 'completed' && !note.trim()) throw new Error('Enter completion notes.');
    if (status === 'active') job.acceptedAt = stamp();
    if (status === 'completed' && job.paymentStatus === 'Pending') { job.paymentStatus = 'Paid'; event(job, 'Cash Payment Recorded', 'Mock cash payment recorded on completion.'); }
    if (status === 'cancelled') {
      refundPayment(job, Number(job.amount));
      if (job.paymentStatus === 'Pending') job.paymentStatus = 'Cancelled';
      job.timeProposal = null;
    }
    job.status = status;
    event(job, status === 'active' ? 'Booking Accepted' : `Status: ${status.replaceAll('_', ' ')}`, note || `Booking ${status.replaceAll('_', ' ')}.`);
    const notifications = read('notifications');
    notify(notifications, parties(job), `Booking ${status === 'active' ? 'Accepted' : status.replaceAll('_', ' ')}`, `${job.serviceTitle}: ${note || status}.`);
    save({ bookings, notifications });
    return job;
  });
}
export async function proposeBookingTime(bookingId, date, slot, providerId) {
  return change(() => {
    const bookings = read('bookings');
    const job = requireRecord(bookings, bookingId, 'Booking');
    checkOwner(job, { userId: providerId }, 'providerId');
    if (job.status !== 'active') throw new Error('Only active bookings can be rescheduled.');
    if (date === job.scheduledDate && slot === job.scheduledSlot) throw new Error('Choose a different date or time.');
    const services = read('services');
    const service = requireRecord(services, job.serviceId, 'Service');
    const provider = requireRecord(read('providers'), providerId, 'Provider');
    if (!availableSlots(service, provider, date, bookings, services, job.id).includes(slot)) throw new Error('The proposed time is unavailable.');
    job.timeProposal = { date, slot, createdAt: stamp() };
    job.status = 'reschedule_proposed';
    event(job, 'Alternative Time Proposed', `${date} at ${slot}. The original schedule remains reserved until the customer agrees.`);
    const notifications = read('notifications');
    notify(notifications, [[job.customerId, `/customer/bookings/${job.id}`]], 'Please Review a Time Proposal', `${job.providerName} proposed ${date} at ${slot} for ${job.serviceTitle}.`);
    save({ bookings, notifications });
    return job;
  });
}
export async function respondToTimeProposal(bookingId, accept, customerId) {
  return change(() => {
    const bookings = read('bookings');
    const job = requireRecord(bookings, bookingId, 'Booking');
    checkOwner(job, { userId: customerId }, 'customerId');
    if (job.status !== 'reschedule_proposed' || !job.timeProposal) throw new Error('This proposal is no longer available.');
    if (accept) {
      const services = read('services');
      const service = requireRecord(services, job.serviceId, 'Service');
      const provider = requireRecord(read('providers'), job.providerId, 'Provider');
      if (!availableSlots(service, provider, job.timeProposal.date, bookings, services, job.id).includes(job.timeProposal.slot)) throw new Error('This time was booked elsewhere. Decline the proposal or ask for a new time.');
      job.scheduledDate = job.timeProposal.date;
      job.scheduledSlot = job.timeProposal.slot;
      job.acceptedAt = stamp();
    }
    job.status = 'active';
    job.timeProposal = null;
    event(job, accept ? 'Reschedule Confirmed' : 'Time Proposal Declined', accept ? `Customer agreed to ${job.scheduledDate} at ${job.scheduledSlot}.` : 'The original schedule remains unchanged.');
    const notifications = read('notifications');
    notify(notifications, parties(job), accept ? 'Reschedule Confirmed' : 'Time Proposal Declined', `${job.serviceTitle}: ${job.scheduledDate} at ${job.scheduledSlot}.`);
    save({ bookings, notifications });
    return job;
  });
}
export async function submitReview(bookingId, rating, comment, customerId) {
  return change(() => {
    const bookings = read('bookings');
    const job = requireRecord(bookings, bookingId, 'Booking');
    checkOwner(job, { userId: customerId }, 'customerId');
    if (job.status !== 'completed' || job.reviewSubmitted) throw new Error('Only completed, unreviewed bookings can be reviewed.');
    if (!Number.isInteger(rating) || rating < 1 || rating > 5 || !comment.trim()) throw new Error('Choose a rating from 1 to 5 and enter a review.');
    Object.assign(job, { reviewSubmitted: true, reviewRating: rating, reviewComment: comment.trim(), reviewDate: stamp() });
    const notifications = read('notifications');
    notify(notifications, [[job.providerId, '/provider/reviews']], 'New Customer Review', `${job.customerName} rated ${job.serviceTitle} ${rating}/5.`);
    save({ bookings, notifications });
    return job;
  });
}
export async function replyToReview(bookingId, reply, providerId) {
  return change(() => {
    const bookings = read('bookings');
    const job = requireRecord(bookings, bookingId, 'Review');
    checkOwner(job, { userId: providerId }, 'providerId');
    if (!job.reviewSubmitted || !reply.trim()) throw new Error('Enter a reply to an existing review.');
    job.reviewReply = reply.trim();
    const notifications = read('notifications');
    notify(notifications, [[job.customerId, `/customer/bookings/${job.id}`]], 'Provider Replied to Your Review', job.reviewReply);
    save({ bookings, notifications });
    return job;
  });
}
export async function getRevenueStats() {
  const bookings = await load('bookings');
  const transactions = bookings.filter(job => isPaid(job) || job.paymentStatus === 'Refunded');
  const categoryMap = {};
  for (const job of transactions) {
    const category = job.categoryName || 'General';
    categoryMap[category] ||= { category, gmv: 0, revenue: 0, count: 0 };
    categoryMap[category].gmv += Number(job.amount);
    categoryMap[category].revenue += job.paymentStatus === 'Refunded' ? 0 : platformFee(job);
    categoryMap[category].count += 1;
  }
  const gmv = transactions.reduce((sum, job) => sum + Number(job.amount), 0);
  const totalRevenue = bookings.filter(isPaid).reduce((sum, job) => sum + platformFee(job), 0);
  return {
    gmv, totalRevenue, totalRefunds: transactions.reduce((sum, job) => sum + Number(job.refundedAmount || 0), 0),
    netCollected: bookings.reduce((sum, job) => sum + collectedAmount(job), 0),
    totalNetPayouts: bookings.filter(job => job.status === 'completed' && isPaid(job)).reduce((sum, job) => sum + netPayout(job), 0),
    transactionCount: transactions.length, avgFeePerBooking: transactions.length ? Math.round(totalRevenue / transactions.length) : 0,
    categoryBreakdown: Object.values(categoryMap), recentTransactions: bookings
  };
}

export async function getTickets(role, userId) {
  const tickets = await load('tickets');
  if (role === 'customer') return tickets.filter(ticket => ticket.customerId === userId);
  if (role === 'provider') return tickets.filter(ticket => ticket.providerId === userId);
  return tickets;
}
export async function createTicket(values) {
  return change(() => {
    const bookings = read('bookings');
    const job = requireRecord(bookings, values.bookingId, 'Booking');
    checkOwner(job, { userId: values.customerId }, 'customerId');
    if (!values.description?.trim()) throw new Error('Describe the service issue.');
    const tickets = read('tickets');
    const ticket = {
      ...values, id: id('TCK'), status: 'open', createdAt: stamp(),
      serviceTitle: job.serviceTitle, customerName: job.customerName, providerName: job.providerName,
      providerId: job.providerId, description: values.description.trim()
    };
    tickets.unshift(ticket);
    job.hasTicket = true;
    const notifications = read('notifications');
    notify(notifications, [['user-admin-1', '/admin/tickets'], [job.providerId, `/provider/jobs/${job.id}`]], 'Support Ticket Opened', `${job.serviceTitle}: ${ticket.description}`);
    save({ tickets, bookings, notifications });
    return ticket;
  });
}
export async function resolveTicket(ticketId, outcome) {
  return change(() => {
    const tickets = read('tickets');
    const ticket = requireRecord(tickets, ticketId, 'Ticket');
    if (ticket.status === 'resolved') throw new Error('This ticket is already resolved.');
    const bookings = read('bookings');
    const job = requireRecord(bookings, ticket.bookingId, 'Booking');
    if (!['Full Mock Refund Issued', 'Partial Refund (50%)', 'Redo Service Requested', 'Formal Warning Issued to Provider', 'Escalated to Arbitration'].includes(outcome)) throw new Error('Choose a supported resolution.');
    const disputes = read('disputes');
    if (outcome === 'Escalated to Arbitration') openDispute(job, { customerId: job.customerId, customerStatement: ticket.description, claimAmount: Number(job.amount), evidences: [] }, disputes);
    if (outcome === 'Full Mock Refund Issued') refundPayment(job, Number(job.amount));
    if (outcome === 'Partial Refund (50%)') refundPayment(job, Math.round(Number(job.amount) * 0.5));
    ticket.status = 'resolved';
    ticket.resolutionOutcome = outcome;
    job.hasTicket = tickets.some(item => item.bookingId === job.id && item.status !== 'resolved');
    event(job, 'Support Ticket Resolved', outcome);
    const notifications = read('notifications');
    notify(notifications, parties(job), 'Support Ticket Resolved', `${job.serviceTitle}: ${outcome}.`);
    save({ tickets, bookings, notifications, disputes });
    return ticket;
  });
}
export const getDisputes = () => load('disputes');
export async function getDisputeById(disputeId) {
  return (await load('disputes')).find(dispute => dispute.id === disputeId) || null;
}
function openDispute(job, values, disputes) {
  if (!['completed', 'in_progress'].includes(job.status)) throw new Error('A dispute can be filed for work in progress or a completed job.');
  if (!values.customerStatement?.trim() || !Number.isFinite(Number(values.claimAmount)) || Number(values.claimAmount) < 0) throw new Error('Enter a statement and a valid claim amount.');
  if (disputes.some(dispute => dispute.bookingId === job.id && dispute.status !== 'ruled')) throw new Error('This booking already has an open dispute.');
  const dispute = {
    ...values, id: id('DISP'), bookingId: job.id, status: 'pending_assignment', createdAt: stamp(),
    serviceTitle: job.serviceTitle, providerId: job.providerId, providerName: job.providerName,
    customerName: job.customerName, amountInDispute: Number(job.amount), claimAmount: Number(values.claimAmount),
    customerStatement: values.customerStatement.trim(), evidences: values.evidences || [], hearingSchedule: null, ruling: null
  };
  disputes.unshift(dispute);
  job.statusBeforeDispute = job.status;
  job.status = 'disputed';
  job.hasDispute = true;
  job.disputeId = dispute.id;
  event(job, 'Dispute Filed', dispute.customerStatement);
  return dispute;
}
export async function createDispute(values) {
  return change(() => {
    const bookings = read('bookings');
    const job = requireRecord(bookings, values.bookingId, 'Booking');
    checkOwner(job, { userId: values.customerId }, 'customerId');
    const disputes = read('disputes');
    const dispute = openDispute(job, values, disputes);
    const notifications = read('notifications');
    notify(notifications, [[job.providerId, `/provider/jobs/${job.id}`], ['user-admin-1', '/admin/disputes']], 'Dispute Filed', `${job.serviceTitle}: case ${dispute.id}.`);
    save({ disputes, bookings, notifications });
    return dispute;
  });
}
export async function assignDispute(disputeId, arbitrator) {
  return change(() => {
    const disputes = read('disputes');
    const dispute = requireRecord(disputes, disputeId, 'Dispute');
    if (dispute.status === 'ruled') throw new Error('A ruled case cannot be reassigned.');
    Object.assign(dispute, { status: 'assigned', arbitratorId: arbitrator.id, arbitratorName: arbitrator.name });
    const job = requireRecord(read('bookings'), dispute.bookingId, 'Booking');
    const notifications = read('notifications');
    notify(notifications, [...parties(job), [arbitrator.id, `/arbitrator/cases/${dispute.id}`]], 'Arbitrator Assigned', `${arbitrator.name} will review case ${dispute.id}.`);
    save({ disputes, notifications });
    return dispute;
  });
}
export async function saveDisputeResponse(disputeId, providerId, statement, filename = '') {
  return change(() => {
    const disputes = read('disputes');
    const dispute = requireRecord(disputes, disputeId, 'Dispute');
    checkOwner(dispute, { userId: providerId }, 'providerId');
    if (dispute.status === 'ruled' || !statement.trim()) throw new Error('Enter a response for an open dispute.');
    dispute.providerStatement = statement.trim();
    if (filename.trim()) dispute.evidences.push({ id: id('ev'), uploader: `${dispute.providerName} (Provider)`, title: filename.trim(), filename: filename.trim(), uploadedAt: stamp() });
    const notifications = read('notifications');
    notify(notifications, [[dispute.arbitratorId || 'user-admin-1', dispute.arbitratorId ? `/arbitrator/cases/${dispute.id}` : '/admin/disputes']], 'Provider Dispute Response', `Provider response added to ${dispute.id}.`);
    save({ disputes, notifications });
    return dispute;
  });
}
export async function scheduleHearing(disputeId, values) {
  return change(() => {
    const disputes = read('disputes');
    const dispute = requireRecord(disputes, disputeId, 'Dispute');
    if (!dispute.arbitratorId || dispute.status === 'ruled') throw new Error('Assign an arbitrator before scheduling an open case.');
    if (!validDate(values.scheduledDate) || values.scheduledDate < localClock().date) throw new Error('Choose today or a future hearing date.');
    if (!Number.isFinite(slotMinutes(values.scheduledTime)) || (values.scheduledDate === localClock().date && slotMinutes(values.scheduledTime) <= localClock().minutes)) throw new Error('Choose a valid future hearing time.');
    if (!/^https?:\/\//i.test(values.meetUrl)) throw new Error('Enter an HTTP or HTTPS meeting URL.');
    Object.assign(dispute, { status: 'hearing_scheduled', hearingSchedule: { ...values, status: 'scheduled' } });
    const job = requireRecord(read('bookings'), dispute.bookingId, 'Booking');
    const notifications = read('notifications');
    notify(notifications, parties(job), 'Dispute Hearing Scheduled', `Case ${dispute.id}: ${values.scheduledDate} at ${values.scheduledTime}.`);
    save({ disputes, notifications });
    return dispute;
  });
}
export async function issueRuling(disputeId, values) {
  return change(() => {
    const disputes = read('disputes');
    const dispute = requireRecord(disputes, disputeId, 'Dispute');
    if (!dispute.arbitratorId || dispute.status === 'ruled') throw new Error('Only an assigned, open case can receive a ruling.');
    if (!['In Favor of Customer', 'In Favor of Provider', 'Mutual Settlement / Split'].includes(values.verdict) || !values.reason.trim() || !Number.isFinite(Number(values.awardAmount)) || Number(values.awardAmount) < 0) throw new Error('Enter a valid verdict, award, and rationale.');
    const bookings = read('bookings');
    const job = requireRecord(bookings, dispute.bookingId, 'Booking');
    if (job.status !== 'disputed') throw new Error('This booking no longer has an open dispute.');
    dispute.status = 'ruled';
    dispute.ruling = { ...values, awardAmount: Number(values.awardAmount), issuedAt: stamp() };
    job.hasDispute = false;
    job.status = job.statusBeforeDispute || 'completed';
    if (values.verdict !== 'In Favor of Provider') {
      refundPayment(job, Number(values.awardAmount));
      if (job.paymentStatus === 'Refunded') job.status = 'cancelled';
    }
    event(job, 'Dispute Resolved', `${values.verdict}. Award: ₹${values.awardAmount}. ${values.reason.trim()}`);
    const notifications = read('notifications');
    notify(notifications, [...parties(job), ['user-admin-1', '/admin/disputes']], 'Dispute Ruling Issued', `Case ${dispute.id}: ${values.verdict}. Award: ₹${values.awardAmount}.`);
    save({ disputes, bookings, notifications });
    return dispute;
  });
}
export async function getNotifications(userId) {
  return (await load('notifications')).filter(notification => notification.userId === userId || !notification.userId);
}
export async function markNotificationsRead(userId, notificationId) {
  return change(() => {
    const notifications = read('notifications');
    for (const notification of notifications) {
      if ((!notification.userId || notification.userId === userId) && (!notificationId || notification.id === notificationId)) notification.read = true;
    }
    save({ notifications });
    return notifications.filter(notification => notification.userId === userId || !notification.userId);
  });
}
export async function getServiceReviews(serviceId) {
  return (await load('bookings')).filter(job => job.serviceId === serviceId && job.reviewSubmitted)
    .map(job => ({ id: job.id, customerName: job.customerName, rating: job.reviewRating, comment: job.reviewComment, reply: job.reviewReply, date: job.reviewDate || job.scheduledDate }));
}
