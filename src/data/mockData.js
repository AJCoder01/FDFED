// ServiceHub Canonical Indian Marketplace Mock Dataset

export const INITIAL_CATEGORIES = [
  { id: 'cat-1', name: 'Home Cleaning', slug: 'home-cleaning', icon: 'Sparkles', description: 'Deep house cleaning, kitchen & bathroom sanitization', serviceCount: 14 },
  { id: 'cat-2', name: 'Plumbing', slug: 'plumbing', icon: 'Wrench', description: 'Leak fixes, pipe installation, tap & drain repairs', serviceCount: 22 },
  { id: 'cat-3', name: 'Electrical Repair', slug: 'electrical-repair', icon: 'Zap', description: 'Wiring, switchboards, fan & light fittings', serviceCount: 18 },
  { id: 'cat-4', name: 'Appliance Repair', slug: 'appliance-repair', icon: 'Tv', description: 'Washing machines, refrigerators, microwave repair', serviceCount: 15 },
  { id: 'cat-5', name: 'AC Maintenance', slug: 'ac-maintenance', icon: 'Wind', description: 'AC servicing, gas refill, installation & uninstallation', serviceCount: 19 },
];

export const DEMO_USERS = {
  customer: {
    id: 'user-cust-1',
    name: 'Aarav Mehta',
    email: 'aarav@gmail.com',
    role: 'customer',
    phone: '+91 98765 43210',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80',
    addresses: [
      { id: 'addr-1', label: 'Home', addressLine: 'Flat 402, Green Glen Layout, Bellandur', city: 'Bengaluru', pincode: '560103', isDefault: true },
      { id: 'addr-2', label: 'Work', addressLine: '9th Floor, Prestage Tech Park, Marathahalli', city: 'Bengaluru', pincode: '560103' }
    ]
  },
  provider: {
    id: 'user-prov-1',
    name: 'Rohan Verma',
    email: 'rohan@gmail.com',
    role: 'provider',
    phone: '+91 91234 56789',
    avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=120&q=80',
    businessName: 'Apex Fix Services & Repairs',
    verificationStatus: 'approved', // draft, submitted, changes_requested, approved, suspended
    rating: 4.8,
    reviewCount: 34,
    serviceArea: 'Bengaluru Urban (Bellandur, HSR Layout, Koramangala, Indiranagar)',
    skills: ['AC Maintenance', 'Electrical Repair', 'Appliance Repair'],
    weeklyAvailability: {
      days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
      startTime: '09:00',
      endTime: '19:00',
      blackoutDates: ['2026-08-25']
    }
  },
  admin: {
    id: 'user-admin-1',
    name: 'Naina Kapoor',
    email: 'admin@gmail.com',
    role: 'admin',
    phone: '+91 99000 11223',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=120&q=80'
  },
  arbitrator: {
    id: 'user-arbit-1',
    name: 'Kabir Malhotra',
    email: 'kabir@gmail.com',
    role: 'arbitrator',
    phone: '+91 94444 88888',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80',
    title: 'Senior Independent Arbitrator'
  }
};

export const INITIAL_SERVICES = [
  {
    id: 'srv-1',
    title: 'Split AC Servicing & Deep Foam Clean',
    categoryId: 'cat-5',
    categoryName: 'AC Maintenance',
    price: 799,
    duration: '60 mins',
    rating: 4.8,
    reviewCount: 28,
    providerId: 'user-prov-1',
    providerName: 'Apex Fix Services & Repairs',
    image: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=600&q=80',
    description: 'Comprehensive high-pressure foam jet cleaning of indoor cooling coils, outdoor condenser unit cleaning, drain pipe flushing, and temperature check.',
    inclusions: ['Indoor unit foam jet wash', 'Outdoor unit jet spray', 'Drain pan & pipe flushing', 'Gas pressure & amp check'],
    exclusions: ['Gas refilling', 'Spare part replacements'],
    policy: 'Free cancellation up to 2 hours before scheduled slot. 100% money back warranty for 30 days.',
    status: 'published', // published, draft, paused, archived
    availableSlots: ['09:00 AM', '11:30 AM', '02:00 PM', '04:30 PM', '06:00 PM']
  },
  {
    id: 'srv-2',
    title: 'Complete Bathroom Deep Cleaning',
    categoryId: 'cat-1',
    categoryName: 'Home Cleaning',
    price: 1299,
    duration: '120 mins',
    rating: 4.7,
    reviewCount: 45,
    providerId: 'user-prov-2',
    providerName: 'Sparkle Clean India',
    image: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=600&q=80',
    description: 'Hard water stain removal, tile scrub, toilet sanitization, mirror cleaning, exhaust fan, and fitting polishing.',
    inclusions: ['Tile grout scrub', 'Hard water stain removal', 'Chrome fitting polish', 'Disinfection spray'],
    exclusions: ['Ceiling paint touchup'],
    policy: 'Free reschedule before 4 hours of appointment.',
    status: 'published',
    availableSlots: ['10:00 AM', '01:00 PM', '03:30 PM']
  },
  {
    id: 'srv-3',
    title: 'Full House Electrical Safety Audit & Fix',
    categoryId: 'cat-3',
    categoryName: 'Electrical Repair',
    price: 499,
    duration: '45 mins',
    rating: 4.9,
    reviewCount: 19,
    providerId: 'user-prov-1',
    providerName: 'Apex Fix Services & Repairs',
    image: 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=600&q=80',
    description: 'Complete inspection of main MCB board, earthing test, switchboard fixes, and replacement of burnt wiring sockets.',
    inclusions: ['Earthing check', 'MCB load audit', 'Fix up to 3 minor sockets'],
    exclusions: ['New heavy wiring materials'],
    policy: '30-day warranty on all electrical labor.',
    status: 'published',
    availableSlots: ['09:30 AM', '12:00 PM', '03:00 PM', '05:30 PM']
  },
  {
    id: 'srv-4',
    title: 'Washing Machine Repair & Drum Sanitization',
    categoryId: 'cat-4',
    categoryName: 'Appliance Repair',
    price: 649,
    duration: '90 mins',
    rating: 4.6,
    reviewCount: 14,
    providerId: 'user-prov-1',
    providerName: 'Apex Fix Services & Repairs',
    image: 'https://images.unsplash.com/photo-1610557892470-55d9e80c0bce?auto=format&fit=crop&w=600&q=80',
    description: 'Diagnose noise, vibration, motor faults, water drain issues, and complete drum scaling treatment.',
    inclusions: ['Diagnosis fee included', 'Descaling treatment', 'Drain pump inspection'],
    exclusions: ['New PCB board cost'],
    policy: 'Inspection fee credited towards repair total.',
    status: 'published',
    availableSlots: ['11:00 AM', '02:30 PM', '05:00 PM']
  }
];

export const INITIAL_BOOKINGS = [
  {
    id: 'BK-89021',
    serviceId: 'srv-1',
    serviceTitle: 'Split AC Servicing & Deep Foam Clean',
    categoryName: 'AC Maintenance',
    customerId: 'user-cust-1',
    customerName: 'Aarav Sharma',
    customerPhone: '+91 98765 43210',
    address: 'Flat 402, Green Glen Layout, Bellandur, Bengaluru - 560103',
    providerId: 'user-prov-1',
    providerName: 'Apex Fix Services & Repairs',
    providerPhone: '+91 91234 56789',
    scheduledDate: '2026-08-20',
    scheduledSlot: '11:30 AM',
    amount: 799,
    platformFee: 40, // 5% platform commission
    netPayout: 759,   // 95% net credited to provider
    paymentMethod: 'UPI (Mock Pay)',
    paymentStatus: 'Paid',
    status: 'active', // active, in_progress, completed, cancelled, reschedule_proposed
    createdAt: '2026-08-16 14:20',
    notes: 'Please call 10 mins before arrival.',
    timeline: [
      { time: '2026-08-16 14:20', title: 'Booking Confirmed', desc: 'Mock payment received via UPI.' },
      { time: '2026-08-16 14:25', title: 'Assigned to Provider', desc: 'Apex Fix Services accepted the booking.' }
    ]
  },
  {
    id: 'BK-88410',
    serviceId: 'srv-3',
    serviceTitle: 'Full House Electrical Safety Audit & Fix',
    categoryName: 'Electrical Repair',
    customerId: 'user-cust-1',
    customerName: 'Aarav Sharma',
    customerPhone: '+91 98765 43210',
    address: 'Flat 402, Green Glen Layout, Bellandur, Bengaluru - 560103',
    providerId: 'user-prov-1',
    providerName: 'Apex Fix Services & Repairs',
    providerPhone: '+91 91234 56789',
    scheduledDate: '2026-08-14',
    scheduledSlot: '03:00 PM',
    amount: 499,
    platformFee: 25,
    netPayout: 474,
    paymentMethod: 'Card (Mock Pay)',
    paymentStatus: 'Paid',
    status: 'completed',
    createdAt: '2026-08-12 10:15',
    notes: 'Switchboard sparking in bedroom.',
    reviewSubmitted: true,
    reviewRating: 5,
    reviewComment: 'Excellent work by Rajesh! Very professional and checked earthing thoroughly.',
    timeline: [
      { time: '2026-08-12 10:15', title: 'Booking Confirmed', desc: 'Mock payment received.' },
      { time: '2026-08-14 15:00', title: 'Work Started', desc: 'Technician reached customer location.' },
      { time: '2026-08-14 16:10', title: 'Work Completed', desc: 'All switches replaced and earthing verified.' }
    ]
  },
  {
    id: 'BK-87102',
    serviceId: 'srv-4',
    serviceTitle: 'Washing Machine Repair & Drum Sanitization',
    categoryName: 'Appliance Repair',
    customerId: 'user-cust-1',
    customerName: 'Aarav Sharma',
    customerPhone: '+91 98765 43210',
    address: 'Flat 402, Green Glen Layout, Bellandur, Bengaluru - 560103',
    providerId: 'user-prov-1',
    providerName: 'Apex Fix Services & Repairs',
    providerPhone: '+91 91234 56789',
    scheduledDate: '2026-08-10',
    scheduledSlot: '02:30 PM',
    amount: 649,
    platformFee: 32,
    netPayout: 617,
    paymentMethod: 'UPI (Mock Pay)',
    paymentStatus: 'Paid',
    status: 'disputed', // conflict/disputed state
    createdAt: '2026-08-08 09:30',
    hasTicket: true,
    hasDispute: true,
    disputeId: 'DISP-101',
    timeline: [
      { time: '2026-08-08 09:30', title: 'Booking Confirmed', desc: 'Mock payment confirmed.' },
      { time: '2026-08-10 14:30', title: 'Work Completed', desc: 'Technician completed repair.' },
      { time: '2026-08-11 11:00', title: 'Customer Reported Issue', desc: 'Washing machine leaking post-repair.' },
      { time: '2026-08-12 14:00', title: 'Dispute Filed', desc: 'Escalated to arbitration due to damage compensation claim.' }
    ]
  },
  {
    id: 'BK-89450',
    serviceId: 'srv-2',
    serviceTitle: 'Complete Bathroom Deep Cleaning',
    categoryName: 'Home Cleaning',
    customerId: 'user-cust-1',
    customerName: 'Aarav Sharma',
    customerPhone: '+91 98765 43210',
    address: '9th Floor, Prestage Tech Park, Marathahalli, Bengaluru',
    providerId: 'user-prov-2',
    providerName: 'Sparkle Clean India',
    providerPhone: '+91 98111 22334',
    scheduledDate: '2026-08-25',
    scheduledSlot: '10:00 AM',
    amount: 1299,
    platformFee: 65,
    netPayout: 1234,
    paymentMethod: 'UPI (Mock Pay)',
    paymentStatus: 'Paid',
    status: 'completed',
    createdAt: '2026-08-18 11:45',
    notes: 'Please bring eco-friendly cleaning chemicals.',
    timeline: [
      { time: '2026-08-18 11:45', title: 'Booking Confirmed', desc: 'Mock payment received via UPI.' },
      { time: '2026-08-25 10:00', title: 'Work Started', desc: 'Cleaner arrived.' },
      { time: '2026-08-25 12:00', title: 'Work Completed', desc: 'Deep cleaning finished.' }
    ]
  },
  {
    id: 'BK-89600',
    serviceId: 'srv-1',
    serviceTitle: 'Split AC Servicing & Deep Foam Clean',
    categoryName: 'AC Maintenance',
    customerId: 'user-cust-1',
    customerName: 'Aarav Sharma',
    customerPhone: '+91 98765 43210',
    address: 'Flat 402, Green Glen Layout, Bellandur, Bengaluru - 560103',
    providerId: 'user-prov-1',
    providerName: 'Apex Fix Services & Repairs',
    providerPhone: '+91 91234 56789',
    scheduledDate: '2026-08-28',
    scheduledSlot: '04:30 PM',
    amount: 1598,
    platformFee: 80,
    netPayout: 1518,
    paymentMethod: 'Card (Mock Pay)',
    paymentStatus: 'Paid',
    status: 'completed',
    createdAt: '2026-08-22 16:10',
    notes: 'Servicing for 2 split AC units.',
    timeline: [
      { time: '2026-08-22 16:10', title: 'Booking Confirmed', desc: 'Mock payment received.' },
      { time: '2026-08-28 16:30', title: 'Work Completed', desc: 'Both AC units serviced.' }
    ]
  }
];

export const INITIAL_TICKETS = [
  {
    id: 'TCK-501',
    bookingId: 'BK-87102',
    serviceTitle: 'Washing Machine Repair',
    customerId: 'user-cust-1',
    customerName: 'Aarav Sharma',
    providerName: 'Apex Fix Services & Repairs',
    issueType: 'Service Quality Issue',
    severity: 'High',
    description: 'After the technician worked on the drum, water began leaking onto our wooden flooring during the spin cycle causing damage.',
    status: 'escalated', // open, in_review, resolved, escalated
    createdAt: '2026-08-11 11:00',
    resolutionOutcome: null
  }
];

export const INITIAL_DISPUTES = [
  {
    id: 'DISP-101',
    bookingId: 'BK-87102',
    serviceTitle: 'Washing Machine Repair & Drum Sanitization',
    customerId: 'user-cust-1',
    customerName: 'Aarav Sharma',
    providerId: 'user-prov-1',
    providerName: 'Apex Fix Services & Repairs',
    amountInDispute: 649,
    claimAmount: 3500, // Claiming flooring damage compensation
    status: 'assigned', // pending_assignment, assigned, hearing_scheduled, ruled, closed
    arbitratorId: 'user-arbit-1',
    arbitratorName: 'Justice V. K. Sundaram (Retd.)',
    createdAt: '2026-08-12 14:00',
    customerStatement: 'Technician left drain hose loose leading to ₹3500 water damage to wooden floor.',
    providerStatement: 'Hose was clamped properly. The customer moved the machine after service.',
    evidences: [
      { id: 'ev-1', uploader: 'Aarav Sharma (Customer)', title: 'Flooring Water Damage Photo', filename: 'floor_damage.jpg', uploadedAt: '2026-08-12 14:15' },
      { id: 'ev-2', uploader: 'Rajesh Kumar (Provider)', title: 'Post-Service Inspection Sheet', filename: 'inspection_signoff.pdf', uploadedAt: '2026-08-12 16:30' }
    ],
    hearingSchedule: {
      scheduledDate: '2026-08-22',
      scheduledTime: '11:00 AM',
      meetUrl: 'https://meet.servicehub.in/dispute-101-hearing',
      status: 'scheduled'
    },
    ruling: null
  }
];

export const INITIAL_NOTIFICATIONS = [
  {
    id: 'notif-1',
    userId: 'user-cust-1',
    title: 'Dispute Hearing Scheduled',
    message: 'Arbitrator Justice Sundaram scheduled a virtual hearing for Case #DISP-101 on Aug 22 at 11:00 AM.',
    targetLink: '/customer/bookings/BK-87102',
    read: false,
    createdAt: '2026-08-12 17:00'
  },
  {
    id: 'notif-2',
    userId: 'user-prov-1',
    title: 'New Job Request',
    message: 'You have a new booking #BK-89021 for Split AC Servicing.',
    targetLink: '/provider/jobs/BK-89021',
    read: true,
    createdAt: '2026-08-16 14:25'
  }
];
