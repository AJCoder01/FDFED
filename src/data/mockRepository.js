import { 
  INITIAL_CATEGORIES, 
  INITIAL_SERVICES, 
  INITIAL_BOOKINGS, 
  INITIAL_TICKETS, 
  INITIAL_DISPUTES, 
  INITIAL_NOTIFICATIONS,
  DEMO_USERS
} from './mockData';

const STORAGE_KEYS = {
  SERVICES: 'servicehub_services',
  BOOKINGS: 'servicehub_bookings',
  TICKETS: 'servicehub_tickets',
  DISPUTES: 'servicehub_disputes',
  NOTIFICATIONS: 'servicehub_notifications',
  CATEGORIES: 'servicehub_categories'
};

// Helper to initialize localStorage with default seeds if empty
function initializeStorage() {
  if (!localStorage.getItem(STORAGE_KEYS.SERVICES)) {
    localStorage.setItem(STORAGE_KEYS.SERVICES, JSON.stringify(INITIAL_SERVICES));
  }
  if (!localStorage.getItem(STORAGE_KEYS.BOOKINGS)) {
    localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(INITIAL_BOOKINGS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.TICKETS)) {
    localStorage.setItem(STORAGE_KEYS.TICKETS, JSON.stringify(INITIAL_TICKETS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.DISPUTES)) {
    localStorage.setItem(STORAGE_KEYS.DISPUTES, JSON.stringify(INITIAL_DISPUTES));
  }
  if (!localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS)) {
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(INITIAL_NOTIFICATIONS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.CATEGORIES)) {
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(INITIAL_CATEGORIES));
  }
}

// Simulated Latency Helper (300ms)
function delay(ms = 300) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Reset Demo Data Utility
export async function resetDemoData() {
  localStorage.setItem(STORAGE_KEYS.SERVICES, JSON.stringify(INITIAL_SERVICES));
  localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(INITIAL_BOOKINGS));
  localStorage.setItem(STORAGE_KEYS.TICKETS, JSON.stringify(INITIAL_TICKETS));
  localStorage.setItem(STORAGE_KEYS.DISPUTES, JSON.stringify(INITIAL_DISPUTES));
  localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(INITIAL_NOTIFICATIONS));
  localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(INITIAL_CATEGORIES));
  await delay(200);
  return { success: true, message: 'All demo data has been reset to baseline seeds!' };
}

// CATEGORIES
export async function getCategories() {
  initializeStorage();
  await delay();
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.CATEGORIES));
}

// SERVICES
export async function getServices(filters = {}) {
  initializeStorage();
  await delay();
  let list = JSON.parse(localStorage.getItem(STORAGE_KEYS.SERVICES));

  if (filters.category) {
    list = list.filter(s => s.categoryId === filters.category || s.categoryName === filters.category);
  }
  if (filters.search) {
    const q = filters.search.toLowerCase();
    list = list.filter(s => s.title.toLowerCase().includes(q) || s.description.toLowerCase().includes(q));
  }
  if (filters.maxPrice) {
    list = list.filter(s => s.price <= Number(filters.maxPrice));
  }
  if (filters.sort === 'price_low') {
    list.sort((a, b) => a.price - b.price);
  } else if (filters.sort === 'price_high') {
    list.sort((a, b) => b.price - a.price);
  } else if (filters.sort === 'rating') {
    list.sort((a, b) => b.rating - a.rating);
  }

  return list;
}

export async function getServiceById(id) {
  initializeStorage();
  await delay();
  const list = JSON.parse(localStorage.getItem(STORAGE_KEYS.SERVICES));
  return list.find(s => s.id === id) || null;
}

export async function getAvailableSlots(serviceId, date) {
  initializeStorage();
  await delay();
  const services = JSON.parse(localStorage.getItem(STORAGE_KEYS.SERVICES));
  const service = services.find(item => item.id === serviceId);
  if (!service) return [];

  const bookings = JSON.parse(localStorage.getItem(STORAGE_KEYS.BOOKINGS));
  const bookedSlots = new Set(
    bookings
      .filter(booking =>
        booking.serviceId === serviceId &&
        booking.scheduledDate === date &&
        booking.status !== 'cancelled'
      )
      .map(booking => booking.scheduledSlot)
  );

  return (service.availableSlots || []).filter(slot => !bookedSlots.has(slot));
}

export async function saveService(serviceData) {
  initializeStorage();
  await delay();
  const list = JSON.parse(localStorage.getItem(STORAGE_KEYS.SERVICES));
  
  if (serviceData.id) {
    const idx = list.findIndex(s => s.id === serviceData.id);
    if (idx !== -1) list[idx] = { ...list[idx], ...serviceData };
  } else {
    const newService = {
      ...serviceData,
      id: `srv-${Date.now()}`,
      rating: 5.0,
      reviewCount: 0,
      status: 'published'
    };
    list.unshift(newService);
  }

  localStorage.setItem(STORAGE_KEYS.SERVICES, JSON.stringify(list));
  return { success: true };
}

// BOOKINGS
export async function getBookings(role, userId) {
  initializeStorage();
  await delay();
  const list = JSON.parse(localStorage.getItem(STORAGE_KEYS.BOOKINGS));

  if (role === 'customer') {
    return list.filter(b => b.customerId === userId);
  }
  if (role === 'provider') {
    return list.filter(b => b.providerId === userId);
  }
  return list; // Admin / Arbitrator get all
}

export async function getBookingById(id) {
  initializeStorage();
  await delay();
  const list = JSON.parse(localStorage.getItem(STORAGE_KEYS.BOOKINGS));
  return list.find(b => b.id === id) || null;
}

export async function createBooking(bookingData) {
  initializeStorage();
  await delay();
  const list = JSON.parse(localStorage.getItem(STORAGE_KEYS.BOOKINGS));
  const services = JSON.parse(localStorage.getItem(STORAGE_KEYS.SERVICES));
  const service = services.find(item => item.id === bookingData.serviceId);

  if (!service || !service.availableSlots?.includes(bookingData.scheduledSlot)) {
    throw new Error('This service does not offer the selected time slot.');
  }

  const slotIsTaken = list.some(booking =>
    booking.serviceId === bookingData.serviceId &&
    booking.scheduledDate === bookingData.scheduledDate &&
    booking.scheduledSlot === bookingData.scheduledSlot &&
    booking.status !== 'cancelled'
  );
  if (slotIsTaken) {
    throw new Error('That slot has just been booked. Please choose another available time.');
  }
  
  const amount = Number(bookingData.amount || 0);
  const platformFee = Math.round(amount * 0.05); // 5% platform fee
  const netPayout = amount - platformFee;        // 95% net provider payout

  const newBooking = {
    ...bookingData,
    id: `BK-${Math.floor(10000 + Math.random() * 90000)}`,
    status: 'active',
    paymentStatus: 'Paid',
    platformFee,
    netPayout,
    createdAt: new Date().toLocaleString('en-GB'),
    timeline: [
      { time: new Date().toLocaleString('en-GB'), title: 'Booking Confirmed', desc: `Mock payment of ₹${amount} received via ${bookingData.paymentMethod || 'UPI'}.` },
      { time: new Date().toLocaleString('en-GB'), title: 'Assigned to Provider', desc: `${bookingData.providerName} received the booking.` }
    ]
  };

  list.unshift(newBooking);
  localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(list));

  // Automatically dispatch Payment Notifications for Provider & Platform Admin
  const notifs = JSON.parse(localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS)) || [];
  
  // 1. Notification to Provider (Receives payment notice with 5% platform fee deduction details)
  notifs.unshift({
    id: `notif-${Date.now()}-prov`,
    userId: bookingData.providerId || 'user-prov-1',
    title: `Payment Notification - #${newBooking.id}`,
    message: `Customer ${bookingData.customerName || 'Aarav Sharma'} paid ₹${amount} for "${bookingData.serviceTitle}". Net credited to wallet after 5% platform fee (₹${platformFee}) is ₹${netPayout}.`,
    targetLink: `/provider/jobs/${newBooking.id}`,
    read: false,
    createdAt: new Date().toLocaleString('en-GB')
  });

  // 2. Notification to Admin (Revenue Alert)
  notifs.unshift({
    id: `notif-${Date.now()}-admin`,
    userId: 'user-admin-1',
    title: `New Revenue Earned - #${newBooking.id}`,
    message: `Booking #${newBooking.id} completed payment of ₹${amount}. Platform 5% commission earned: ₹${platformFee}.`,
    targetLink: '/admin/revenue',
    read: false,
    createdAt: new Date().toLocaleString('en-GB')
  });

  localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifs));

  return newBooking;
}

// REVENUE & FINANCIAL STATS (5% Platform Fee Model)
export async function getRevenueStats() {
  initializeStorage();
  await delay();
  const bookings = JSON.parse(localStorage.getItem(STORAGE_KEYS.BOOKINGS)) || [];

  const paidBookings = bookings.filter(b => b.paymentStatus === 'Paid' || b.paymentStatus === 'Completed');
  const gmv = paidBookings.reduce((sum, b) => sum + (Number(b.amount) || 0), 0);
  const totalRevenue = paidBookings.reduce((sum, b) => {
    const fee = b.platformFee !== undefined ? b.platformFee : Math.round((Number(b.amount) || 0) * 0.05);
    return sum + fee;
  }, 0);
  const totalNetPayouts = gmv - totalRevenue;
  const transactionCount = paidBookings.length;
  const avgFeePerBooking = transactionCount > 0 ? Math.round(totalRevenue / transactionCount) : 0;

  // Breakdown by Category
  const categoryMap = {};
  paidBookings.forEach(b => {
    const cat = b.categoryName || 'General';
    const amt = Number(b.amount) || 0;
    const fee = b.platformFee !== undefined ? b.platformFee : Math.round(amt * 0.05);
    if (!categoryMap[cat]) categoryMap[cat] = { category: cat, gmv: 0, revenue: 0, count: 0 };
    categoryMap[cat].gmv += amt;
    categoryMap[cat].revenue += fee;
    categoryMap[cat].count += 1;
  });

  return {
    gmv,
    totalRevenue,
    totalNetPayouts,
    transactionCount,
    avgFeePerBooking,
    categoryBreakdown: Object.values(categoryMap),
    recentTransactions: bookings
  };
}

export async function updateBookingStatus(id, newStatus, note = '') {
  initializeStorage();
  await delay();
  const list = JSON.parse(localStorage.getItem(STORAGE_KEYS.BOOKINGS));
  const booking = list.find(b => b.id === id);

  if (booking) {
    booking.status = newStatus;
    booking.timeline.push({
      time: new Date().toLocaleString('en-GB'),
      title: `Status: ${newStatus.replace('_', ' ').toUpperCase()}`,
      desc: note || `Updated booking state to ${newStatus}`
    });
    localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(list));
  }
  return booking;
}

// SUPPORT TICKETS
export async function getTickets() {
  initializeStorage();
  await delay();
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.TICKETS));
}

export async function createTicket(ticketData) {
  initializeStorage();
  await delay();
  const list = JSON.parse(localStorage.getItem(STORAGE_KEYS.TICKETS));
  const newTicket = {
    ...ticketData,
    id: `TCK-${Math.floor(100 + Math.random() * 900)}`,
    status: 'open',
    createdAt: new Date().toLocaleString('en-GB')
  };
  list.unshift(newTicket);
  localStorage.setItem(STORAGE_KEYS.TICKETS, JSON.stringify(list));
  return newTicket;
}

export async function resolveTicket(id, outcome) {
  initializeStorage();
  await delay();
  const list = JSON.parse(localStorage.getItem(STORAGE_KEYS.TICKETS));
  const ticket = list.find(t => t.id === id);
  if (ticket) {
    ticket.status = 'resolved';
    ticket.resolutionOutcome = outcome;
    localStorage.setItem(STORAGE_KEYS.TICKETS, JSON.stringify(list));
  }
  return ticket;
}

// DISPUTES
export async function getDisputes() {
  initializeStorage();
  await delay();
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.DISPUTES));
}

export async function getDisputeById(id) {
  initializeStorage();
  await delay();
  const list = JSON.parse(localStorage.getItem(STORAGE_KEYS.DISPUTES));
  return list.find(d => d.id === id) || null;
}

export async function createDispute(disputeData) {
  initializeStorage();
  await delay();
  const list = JSON.parse(localStorage.getItem(STORAGE_KEYS.DISPUTES));
  const newDispute = {
    ...disputeData,
    id: `DISP-${Math.floor(100 + Math.random() * 900)}`,
    status: 'pending_assignment',
    createdAt: new Date().toLocaleString('en-GB'),
    evidences: disputeData.evidences || [],
    hearingSchedule: null,
    ruling: null
  };
  list.unshift(newDispute);
  localStorage.setItem(STORAGE_KEYS.DISPUTES, JSON.stringify(list));

  // Also update booking status to disputed
  await updateBookingStatus(disputeData.bookingId, 'disputed', 'Customer filed a formal dispute.');

  return newDispute;
}

export async function assignDispute(disputeId, arbitrator) {
  initializeStorage();
  await delay();
  const list = JSON.parse(localStorage.getItem(STORAGE_KEYS.DISPUTES));
  const dispute = list.find(d => d.id === disputeId);
  if (dispute) {
    dispute.status = 'assigned';
    dispute.arbitratorId = arbitrator.id;
    dispute.arbitratorName = arbitrator.name;
    localStorage.setItem(STORAGE_KEYS.DISPUTES, JSON.stringify(list));
  }
  return dispute;
}

export async function scheduleHearing(disputeId, hearingData) {
  initializeStorage();
  await delay();
  const list = JSON.parse(localStorage.getItem(STORAGE_KEYS.DISPUTES));
  const dispute = list.find(d => d.id === disputeId);
  if (dispute) {
    dispute.status = 'hearing_scheduled';
    dispute.hearingSchedule = {
      ...hearingData,
      status: 'scheduled'
    };
    localStorage.setItem(STORAGE_KEYS.DISPUTES, JSON.stringify(list));
  }
  return dispute;
}

export async function issueRuling(disputeId, rulingData) {
  initializeStorage();
  await delay();
  const list = JSON.parse(localStorage.getItem(STORAGE_KEYS.DISPUTES));
  const dispute = list.find(d => d.id === disputeId);
  if (dispute) {
    dispute.status = 'ruled';
    dispute.ruling = {
      ...rulingData,
      issuedAt: new Date().toLocaleString('en-GB')
    };
    localStorage.setItem(STORAGE_KEYS.DISPUTES, JSON.stringify(list));
  }
  return dispute;
}

// NOTIFICATIONS
export async function getNotifications(userId) {
  initializeStorage();
  await delay();
  const list = JSON.parse(localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS));
  return list.filter(n => n.userId === userId || !n.userId);
}
