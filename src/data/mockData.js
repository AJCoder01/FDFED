export const DEFAULT_BLANK_AVATAR = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' fill='%23E2E8F0'%3E%3Crect width='100' height='100' rx='50' fill='%23F1F5F9'/%3E%3Ccircle cx='50' cy='38' r='18' fill='%2394A3B8'/%3E%3Cpath d='M20 86c0-16.569 13.431-30 30-30s30 13.431 30 30' fill='%2394A3B8'/%3E%3C/svg%3E";
export const DEFAULT_SERVICE_IMAGE = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 600 400' fill='%23F1F5F9'%3E%3Crect width='600' height='400' fill='%23F8FAFC'/%3E%3Crect x='1' y='1' width='598' height='398' fill='none' stroke='%23CBD5E1' stroke-width='2' rx='12'/%3E%3Cpath d='M250 170a50 50 0 1 0 100 0 50 50 0 0 0-100 0zm-70 140c0-45 55-80 120-80s120 35 120 80H180z' fill='%23CBD5E1'/%3E%3Ctext x='50%25' y='82%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='22' font-weight='700' fill='%2364748B'%3EServiceHub Service Listing%3C/text%3E%3C/svg%3E";

export const INITIAL_CATEGORIES = [
  { id: 'cat-1', name: 'Home Cleaning', slug: 'home-cleaning', icon: 'Sparkles', description: 'Deep house cleaning, kitchen & bathroom sanitization', serviceCount: 14 },
  { id: 'cat-2', name: 'Plumbing', slug: 'plumbing', icon: 'Wrench', description: 'Leak fixes, pipe installation, tap & drain repairs', serviceCount: 22 },
  { id: 'cat-3', name: 'Electrical Repair', slug: 'electrical-repair', icon: 'Zap', description: 'Wiring, switchboards, fan & light fittings', serviceCount: 18 },
  { id: 'cat-4', name: 'Appliance Repair', slug: 'appliance-repair', icon: 'Tv', description: 'Washing machines, refrigerators, microwave repair', serviceCount: 15 },
  { id: 'cat-5', name: 'AC Maintenance', slug: 'ac-maintenance', icon: 'Wind', description: 'AC servicing, gas refill, installation & uninstallation', serviceCount: 19 },
  { id: 'cat-6', name: 'Others', slug: 'others', icon: 'MoreHorizontal', description: 'Carpentry, painting, pest control & custom handyman assistance', serviceCount: 12 },
];

export const DEMO_USERS = {
  customer: {
    id: 'user-cust-1',
    name: 'Aarav Mehta',
    email: 'aarav@gmail.com',
    role: 'customer',
    phone: '+91 98765 43210',
    avatar: DEFAULT_BLANK_AVATAR,
    location: 'Bengaluru',
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
    avatar: DEFAULT_BLANK_AVATAR,
    businessName: 'UrbanFix Home Solutions',
    verificationStatus: 'approved', // draft, submitted, changes_requested, approved, suspended
    rating: 4.8,
    reviewCount: 34,
    serviceArea: 'Bengaluru',
    location: 'Bengaluru',
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
    isSuperUser: true,
    phone: '+91 99000 11223',
    avatar: DEFAULT_BLANK_AVATAR,
    location: 'Bengaluru'
  },
  staffAdmin: {
    id: 'user-admin-2',
    name: 'Priya Nair',
    email: 'staffadmin@gmail.com',
    role: 'admin',
    isSuperUser: false,
    phone: '+91 99000 44556',
    avatar: DEFAULT_BLANK_AVATAR,
    department: 'Platform Operations',
    location: 'Bengaluru'
  },
  arbitrator: {
    id: 'user-arbit-1',
    name: 'Kabir Malhotra',
    email: 'kabir@gmail.com',
    role: 'arbitrator',
    phone: '+91 94444 88888',
    avatar: DEFAULT_BLANK_AVATAR,
    title: 'Senior Independent Arbitrator',
    location: 'Bengaluru'
  }
};

export const DEFAULT_DEMO_PASSWORD = '123456Ab@';

export const INITIAL_ACCOUNTS = Object.values(DEMO_USERS).map(user => ({
  ...user,
  password: DEFAULT_DEMO_PASSWORD,
  createdAt: '2026-08-01T09:00:00.000Z'
}));

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
    providerName: 'UrbanFix Home Solutions',
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
    providerName: 'UrbanFix Home Solutions',
    image: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=600&q=80',
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
    providerName: 'UrbanFix Home Solutions',
    image: DEFAULT_SERVICE_IMAGE,
    description: 'Diagnose noise, vibration, motor faults, water drain issues, and complete drum scaling treatment.',
    inclusions: ['Diagnosis fee included', 'Descaling treatment', 'Drain pump inspection'],
    exclusions: ['New PCB board cost'],
    policy: 'Inspection fee credited towards repair total.',
    status: 'published',
    availableSlots: ['11:00 AM', '02:30 PM', '05:00 PM']
  },
  {
    id: 'srv-5',
    title: 'General Handyman, Furniture Assembly & Minor Fixes',
    categoryId: 'cat-6',
    categoryName: 'Others',
    price: 399,
    duration: '60 mins',
    rating: 4.8,
    reviewCount: 21,
    providerId: 'user-prov-1',
    providerName: 'UrbanFix Home Solutions',
    image: DEFAULT_SERVICE_IMAGE,
    description: 'Wall drill hanging, curtain rod installation, door hinge tightening, bed assembly, and customized general handyman tasks.',
    inclusions: ['Up to 60 mins labor', 'Tool kit and screw fasteners', 'Debris clean-up'],
    exclusions: ['Heavy replacement hardware'],
    policy: 'Free cancellation up to 2 hours before scheduled slot.',
    status: 'published',
    availableSlots: ['09:00 AM', '11:30 AM', '02:30 PM', '05:00 PM']
  }
];

export const INITIAL_BOOKINGS = [
  {
    id: 'BK-89021',
    serviceId: 'srv-1',
    serviceTitle: 'Split AC Servicing & Deep Foam Clean',
    categoryName: 'AC Maintenance',
    customerId: 'user-cust-1',
    customerName: 'Aarav Mehta',
    customerPhone: '+91 98765 43210',
    address: 'Flat 402, Green Glen Layout, Bellandur, Bengaluru - 560103',
    providerId: 'user-prov-1',
    providerName: 'UrbanFix Home Solutions',
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
      { time: '2026-08-16 14:25', title: 'Assigned to Provider', desc: 'UrbanFix Home Solutions accepted the booking.' }
    ]
  },
  {
    id: 'BK-88410',
    serviceId: 'srv-3',
    serviceTitle: 'Full House Electrical Safety Audit & Fix',
    categoryName: 'Electrical Repair',
    customerId: 'user-cust-1',
    customerName: 'Aarav Mehta',
    customerPhone: '+91 98765 43210',
    address: 'Flat 402, Green Glen Layout, Bellandur, Bengaluru - 560103',
    providerId: 'user-prov-1',
    providerName: 'UrbanFix Home Solutions',
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
    reviewComment: 'Excellent work by technician! Very professional and checked earthing thoroughly.',
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
    customerName: 'Aarav Mehta',
    customerPhone: '+91 98765 43210',
    address: 'Flat 402, Green Glen Layout, Bellandur, Bengaluru - 560103',
    providerId: 'user-prov-1',
    providerName: 'UrbanFix Home Solutions',
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
    customerName: 'Aarav Mehta',
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
    customerName: 'Aarav Mehta',
    customerPhone: '+91 98765 43210',
    address: 'Flat 402, Green Glen Layout, Bellandur, Bengaluru - 560103',
    providerId: 'user-prov-1',
    providerName: 'UrbanFix Home Solutions',
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
    customerName: 'Aarav Mehta',
    providerName: 'UrbanFix Home Solutions',
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
    customerName: 'Aarav Mehta',
    providerId: 'user-prov-1',
    providerName: 'UrbanFix Home Solutions',
    amountInDispute: 649,
    claimAmount: 3500, // Claiming flooring damage compensation
    status: 'hearing_scheduled', // pending_assignment, assigned, hearing_scheduled, ruled, closed
    arbitratorId: 'user-arbit-1',
    arbitratorName: 'Kabir Malhotra',
    createdAt: '2026-08-12 14:00',
    customerStatement: 'Technician left drain hose loose leading to ₹3,500 water damage to wooden floor.',
    providerStatement: 'Hose was clamped properly. The customer moved the machine after service.',
    evidences: [
      { id: 'ev-1', uploader: 'Aarav Mehta (Customer)', title: 'Flooring Water Damage Photo', filename: 'floor_damage.jpg', uploadedAt: '2026-08-12 14:15' },
      { id: 'ev-2', uploader: 'Rohan Verma (Provider)', title: 'Post-Service Inspection Sheet', filename: 'inspection_signoff.pdf', uploadedAt: '2026-08-12 16:30' }
    ],
    hearingSchedule: {
      scheduledDate: '2026-08-22',
      scheduledTime: '11:00 AM',
      meetUrl: 'https://meet.google.com/arb-disp-101'
    },
    ruling: null
  },
  {
    id: 'DISP-102',
    bookingId: 'BK-88410',
    serviceTitle: 'Full House Electrical Safety Audit & Fix',
    customerId: 'user-cust-1',
    customerName: 'Aarav Mehta',
    providerId: 'user-prov-1',
    providerName: 'UrbanFix Home Solutions',
    amountInDispute: 499,
    claimAmount: 1200,
    status: 'ruled',
    arbitratorId: 'user-arbit-1',
    arbitratorName: 'Kabir Malhotra',
    createdAt: '2026-08-02 10:00',
    customerStatement: 'Substandard replacement socket blew fuse in inverter.',
    providerStatement: 'Replacement socket was ISI certified standard brand.',
    evidences: [
      { id: 'ev-3', uploader: 'Aarav Mehta (Customer)', title: 'Burnt Socket Photo', filename: 'socket_damage.jpg', uploadedAt: '2026-08-02 11:00' }
    ],
    hearingSchedule: {
      scheduledDate: '2026-08-05',
      scheduledTime: '02:00 PM',
      meetUrl: 'https://meet.google.com/arb-disp-102'
    },
    ruling: {
      verdict: 'In favour of Customer',
      awardAmount: 1200,
      reason: 'Technical inspection confirmed improper socket rating for inverter load. Partial refund and equipment compensation awarded.',
      issuedAt: '2026-08-06 15:30'
    }
  },
  {
    id: 'DISP-103',
    bookingId: 'BK-89450',
    serviceTitle: 'Complete Bathroom Deep Cleaning',
    customerId: 'user-cust-1',
    customerName: 'Aarav Mehta',
    providerId: 'user-prov-2',
    providerName: 'Sparkle Clean India',
    amountInDispute: 1299,
    claimAmount: 1299,
    status: 'pending_assignment',
    arbitratorId: null,
    arbitratorName: null,
    createdAt: '2026-08-19 16:00',
    customerStatement: 'Cleaner did not clean tile grout as advertised in package.',
    providerStatement: 'Grout was stained permanently by hard water over 5 years.',
    evidences: [
      { id: 'ev-4', uploader: 'Aarav Mehta (Customer)', title: 'Uncleaned Bathroom Tile Photo', filename: 'tiles.jpg', uploadedAt: '2026-08-19 16:30' }
    ],
    hearingSchedule: null,
    ruling: null
  }
];

export const INITIAL_NOTIFICATIONS = [
  {
    id: 'notif-1',
    userId: 'user-cust-1',
    title: 'Dispute Hearing Scheduled',
    message: 'Arbitrator Kabir Malhotra scheduled a hearing for Case #DISP-101 on 2026-08-22 at 11:00 AM.',
    targetLink: '/customer/bookings/BK-87102',
    read: false,
    createdAt: '2026-08-14 11:30'
  },
  {
    id: 'notif-2',
    userId: 'user-prov-1',
    title: 'Dispute Hearing Scheduled',
    message: 'Arbitrator Kabir Malhotra scheduled a hearing for Case #DISP-101 on 2026-08-22 at 11:00 AM.',
    targetLink: '/provider/jobs/BK-87102',
    read: false,
    createdAt: '2026-08-14 11:30'
  }
];

export const INITIAL_ARBITRATOR_APPLICATIONS = [
  {
    id: 'arb-app-101',
    name: 'Devraj Sen',
    email: 'devraj.arbitration@legalhub.in',
    phone: '9876543210',
    country: 'India',
    linkedin: 'https://linkedin.com/in/devrajsen-arb',
    title: 'Commercial Arbitrator & Mediator',
    experience: 12,
    expertise: 'Consumer Contract & Service Quality Disputes',
    organization: 'Indian Council of Arbitration',
    prevExperience: 'Empaneled with national consumer dispute panels; adjudicated over 60 service delivery conflicts.',
    files: {
      resume: 'devraj_sen_curriculum_vitae.pdf',
      cert: 'arbitration_fellowship_cert.pdf',
      license: 'bar_council_advocate_license.pdf',
      extra: 'sample_service_dispute_award.pdf'
    },
    status: 'pending', // pending, approved, rejected
    submittedAt: '2026-08-15T10:30:00.000Z'
  }
];
