export function toUiRole(role: string): string {
  const upper = String(role || '').toUpperCase();
  if (upper === 'SUPER_ADMIN') return 'admin';
  return upper.toLowerCase();
}

export function serializeAddress(addr: any) {
  return {
    id: addr.id,
    label: addr.label,
    addressLine: addr.line1,
    line1: addr.line1,
    city: addr.city,
    state: addr.state || 'Karnataka',
    pincode: addr.pinCode,
    pinCode: addr.pinCode,
    isDefault: Boolean(addr.isDefault),
  };
}

export function serializeAccount(account: any) {
  if (!account) return null;
  const uiRole = toUiRole(account.role);
  const isSuperUser =
    Boolean(account.isSuperUser) ||
    String(account.role).toUpperCase() === 'SUPER_ADMIN' ||
    account.id === 'user-admin-1';

  const base: any = {
    id: account.id,
    name: account.name,
    email: account.email,
    role: uiRole,
    isSuperUser,
    status: account.status || 'active',
    phone: account.phone,
    avatar: account.avatar,
    location: account.location || account.city || 'Bengaluru',
    city: account.city || account.location || 'Bengaluru',
    country: account.country || 'India',
    department: account.department || undefined,
    walletBalance: account.walletBalanceInr ?? 0,
    walletBalanceInr: account.walletBalanceInr ?? 0,
    createdAt: account.createdAt instanceof Date ? account.createdAt.toISOString() : account.createdAt,
  };

  if (account.customerProfile) {
    base.addresses = (account.customerProfile.addresses || []).map(serializeAddress);
  }

  if (account.providerProfile) {
    const p = account.providerProfile;
    base.providerType = p.providerType || 'company';
    base.businessName = p.businessName;
    base.bio = p.bio;
    base.experienceYears = p.experienceYears ?? 0;
    base.operatingCity = p.operatingCity || 'Bengaluru';
    base.serviceArea = p.serviceArea;
    base.servedAreas = Array.isArray(p.servedAreas) ? p.servedAreas : [];
    base.servedPincodes = Array.isArray(p.servedPincodes) ? p.servedPincodes : [];
    base.coverageRadiusKm = p.coverageRadiusKm ?? 25;
    base.skills = p.skills || [];
    base.documentName = p.documentName;
    base.verificationStatus = p.verificationStatus;
    base.verificationFeedback = p.verificationFeedback;
    base.weeklyAvailability = p.weeklyAvailability;
    base.blackoutDates = p.blackoutDates || [];
    base.leadTimeMinutes = p.leadTimeMinutes;
    base.bufferMinutes = p.bufferMinutes;
    base.rating = p.ratingAvg;
    base.reviewCount = p.reviewCount;
  }

  if (account.arbitratorProfile) {
    const arb = account.arbitratorProfile;
    base.title = arb.title;
    base.barCouncilId = arb.barCouncilId;
    base.qualification = arb.qualification;
    base.experience = arb.experienceYears;
    base.specialization = arb.specialization;
    base.organization = arb.organization;
  }

  return base;
}

export function serializeProvider(provider: any) {
  if (!provider) return null;
  const acc = provider.account || {};
  return {
    id: provider.id,
    accountId: provider.accountId,
    role: 'provider',
    providerType: provider.providerType || 'company',
    name: acc.name || provider.businessName,
    email: acc.email || '',
    phone: acc.phone || '',
    avatar: acc.avatar || '',
    location: acc.location || provider.operatingCity || provider.serviceArea,
    operatingCity: provider.operatingCity || 'Bengaluru',
    businessName: provider.businessName,
    bio: provider.bio,
    experienceYears: provider.experienceYears ?? 0,
    serviceArea: provider.serviceArea,
    servedAreas: Array.isArray(provider.servedAreas) ? provider.servedAreas : [],
    servedPincodes: Array.isArray(provider.servedPincodes) ? provider.servedPincodes : [],
    coverageRadiusKm: provider.coverageRadiusKm ?? 25,
    skills: provider.skills || [],
    documentName: provider.documentName || '',
    verificationStatus: provider.verificationStatus,
    verificationFeedback: provider.verificationFeedback || '',
    weeklyAvailability: provider.weeklyAvailability,
    blackoutDates: provider.blackoutDates || [],
    leadTimeMinutes: provider.leadTimeMinutes,
    bufferMinutes: provider.bufferMinutes,
    rating: provider.ratingAvg,
    reviewCount: provider.reviewCount,
  };
}

export function serializeService(service: any, reviews: any[] = []) {
  const serviceReviews = reviews.filter((r) => r.serviceId === service.id);
  const reviewCount = serviceReviews.length || service.reviewCount || 0;
  const rating =
    serviceReviews.length > 0
      ? serviceReviews.reduce((sum, r) => sum + Number(r.rating), 0) / serviceReviews.length
      : service.rating;

  const prov = service.provider || null;

  return {
    id: service.id,
    providerId: service.providerId,
    providerName: service.providerName,
    providerType: prov?.providerType || 'company',
    providerOperatingCity: prov?.operatingCity || 'Bengaluru',
    providerServiceArea: prov?.serviceArea || '',
    providerServedAreas: Array.isArray(prov?.servedAreas) ? prov.servedAreas : [],
    providerServedPincodes: Array.isArray(prov?.servedPincodes) ? prov.servedPincodes : [],
    providerCoverageRadiusKm: prov?.coverageRadiusKm ?? 25,
    providerVerificationStatus: prov?.verificationStatus,
    categoryId: service.categoryId,
    categoryName: service.categoryName,
    title: service.title,
    description: service.description,
    price: service.priceInr,
    priceInr: service.priceInr,
    durationMinutes: service.durationMinutes,
    duration: service.duration,
    mode: service.mode || 'On-site',
    image: service.image,
    inclusions: Array.isArray(service.inclusions) ? service.inclusions : [],
    exclusions: Array.isArray(service.exclusions) ? service.exclusions : [],
    policy: service.policy,
    freeCancellationHours: service.freeCancellationHours ?? 2,
    cancellationFeePercent: service.cancellationFeePercent ?? 20,
    availableSlots: Array.isArray(service.availableSlots) ? service.availableSlots : [],
    status: String(service.status || 'PUBLISHED').toLowerCase(),
    rating,
    reviewCount,
    createdAt: service.createdAt instanceof Date ? service.createdAt.toISOString() : service.createdAt,
  };
}

export function serializeBooking(booking: any) {
  const ledger = booking.paymentLedger || {};
  const review = booking.review || null;
  const dispute = booking.dispute || null;

  return {
    id: booking.id,
    bookingCode: booking.bookingCode,
    serviceId: booking.serviceId,
    serviceTitle: booking.serviceTitle,
    categoryName: booking.categoryName,
    customerId: booking.customerId,
    customerName: booking.customerName,
    customerPhone: booking.customerPhone,
    providerId: booking.providerId,
    providerName: booking.providerName,
    providerPhone: booking.providerPhone,
    address: booking.address,
    addressSnapshot: booking.addressSnapshot,
    scheduledDate: booking.scheduledDate,
    scheduledSlot: booking.scheduledSlot,
    duration: booking.duration,
    amount: booking.amountInr,
    amountInr: booking.amountInr,
    freeCancellationHours: booking.freeCancellationHours ?? 2,
    cancellationFeePercent: booking.cancellationFeePercent ?? 20,
    freeCancellationUntil:
      booking.freeCancellationUntil instanceof Date
        ? booking.freeCancellationUntil.toISOString()
        : booking.freeCancellationUntil || null,
    platformFee: ledger.platformFeeInr ?? Math.round(Number(booking.amountInr) * 0.05),
    netPayout: ledger.providerNetPayoutInr ?? Number(booking.amountInr) - Math.round(Number(booking.amountInr) * 0.05),
    refundedAmount: ledger.refundedAmountInr ?? 0,
    cancellationFee: ledger.cancellationFeeInr ?? 0,
    arbitratorFee: ledger.arbitratorFeeInr ?? 0,
    paymentMethod: ledger.paymentMethod || 'UPI (Mock Pay)',
    paymentStatus: ledger.paymentStatus || 'Paid',
    status: booking.status,
    statusBeforeDispute: booking.statusBeforeDispute,
    acceptedAt: booking.acceptedAt instanceof Date ? booking.acceptedAt.toISOString() : booking.acceptedAt,
    notes: booking.notes || '',
    timeProposal: booking.timeProposal || null,
    timeline: Array.isArray(booking.timeline) ? booking.timeline : [],
    hasTicket: Boolean(booking.hasTicket),
    hasDispute: Boolean(booking.hasDispute),
    disputeId: booking.disputeId || dispute?.id || null,
    hearingSchedule: dispute?.hearingSchedule || null,
    ruling: dispute?.ruling || null,
    disputeRuling: dispute?.ruling || null,
    reviewSubmitted: Boolean(review),
    reviewRating: review?.rating ?? null,
    reviewComment: review?.comment ?? null,
    reviewDate: review?.createdAt instanceof Date ? review.createdAt.toISOString() : review?.createdAt ?? null,
    reviewReply: review?.reply ?? null,
    createdAt: booking.createdAt instanceof Date ? booking.createdAt.toISOString() : booking.createdAt,
  };
}

export function serializeTicket(ticket: any) {
  return {
    id: ticket.id,
    ticketCode: ticket.ticketCode,
    bookingId: ticket.bookingId,
    customerId: ticket.creatorId,
    creatorId: ticket.creatorId,
    providerId: ticket.providerId,
    serviceTitle: ticket.serviceTitle,
    customerName: ticket.customerName,
    providerName: ticket.providerName,
    issueType: ticket.issueType,
    severity: ticket.severity,
    subject: ticket.subject,
    category: ticket.category,
    priority: ticket.priority,
    description: ticket.description,
    status: ticket.status,
    messages: Array.isArray(ticket.messages) ? ticket.messages : [],
    resolutionOutcome: ticket.resolutionOutcome,
    resolutionNotes: ticket.resolutionNotes,
    createdAt: ticket.createdAt instanceof Date ? ticket.createdAt.toISOString() : ticket.createdAt,
  };
}

export function serializeDispute(dispute: any) {
  return {
    id: dispute.id,
    disputeCode: dispute.disputeCode,
    bookingId: dispute.bookingId,
    serviceTitle: dispute.serviceTitle,
    customerId: dispute.customerId,
    customerName: dispute.customerName,
    providerId: dispute.providerId,
    providerName: dispute.providerName,
    arbitratorId: dispute.arbitratorId,
    arbitratorName: dispute.arbitratorName,
    amountInDispute: dispute.amountInDispute,
    claimAmount: dispute.claimAmount,
    reason: dispute.reason,
    customerStatement: dispute.customerStatement,
    providerStatement: dispute.providerStatement || '',
    evidences: Array.isArray(dispute.evidences) ? dispute.evidences : [],
    customerEvidence: Array.isArray(dispute.customerEvidence) ? dispute.customerEvidence : [],
    providerEvidence: Array.isArray(dispute.providerEvidence) ? dispute.providerEvidence : [],
    hearingSchedule: dispute.hearingSchedule || null,
    ruling: dispute.ruling || null,
    rulingDecision: dispute.rulingDecision || null,
    refundPercentage: dispute.refundPercentage ?? null,
    status: dispute.status,
    createdAt: dispute.createdAt instanceof Date ? dispute.createdAt.toISOString() : dispute.createdAt,
  };
}

export function serializeNotification(notif: any) {
  return {
    id: notif.id,
    userId: notif.userId,
    type: notif.type,
    title: notif.title,
    message: notif.message,
    targetLink: notif.targetLink,
    read: Boolean(notif.isRead),
    isRead: Boolean(notif.isRead),
    createdAt: notif.createdAt instanceof Date ? notif.createdAt.toISOString() : notif.createdAt,
  };
}

export function serializeActivityLog(log: any) {
  return {
    id: log.id,
    userId: log.actorId,
    userEmail: log.actorEmail,
    userName: log.actorName,
    role: log.actorRole,
    type: log.action,
    entityType: log.entityType,
    entityId: log.entityId,
    description: log.description,
    metadata: log.metadata,
    timestamp: log.createdAt instanceof Date ? log.createdAt.toISOString() : log.createdAt,
  };
}

export function serializeArbitratorApplication(app: any) {
  return {
    id: app.id,
    name: app.name,
    email: app.email,
    phone: app.phone,
    country: app.country,
    linkedin: app.linkedin,
    title: app.title,
    barCouncilId: app.barCouncilId,
    qualification: app.qualification,
    experience: app.experienceYears,
    expertise: app.specialization,
    organization: app.organization,
    prevExperience: app.prevExperience,
    files: app.files || {},
    status: app.status,
    rejectReason: app.rejectReason || undefined,
    submittedAt: app.submittedAt instanceof Date ? app.submittedAt.toISOString() : app.submittedAt,
    decidedAt: app.decidedAt instanceof Date ? app.decidedAt.toISOString() : app.decidedAt,
  };
}

export function serializeWalletTransaction(txn: any) {
  return {
    id: txn.id,
    accountId: txn.accountId,
    bookingId: txn.bookingId || null,
    disputeId: txn.disputeId || null,
    type: txn.type,
    direction: txn.direction,
    amount: txn.amountInr,
    amountInr: txn.amountInr,
    grossAmount: txn.grossAmountInr,
    platformFee: txn.platformFeeInr,
    netAmount: txn.netAmountInr,
    cancellationCharge: txn.cancellationChargeInr,
    status: txn.status,
    description: txn.description,
    createdAt: txn.createdAt instanceof Date ? txn.createdAt.toISOString() : txn.createdAt,
  };
}
