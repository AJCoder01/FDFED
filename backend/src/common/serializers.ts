export const userInclude = {
  provider: {
    include: {
      availability: true,
      bookings: { select: { review: { select: { rating: true } } } },
    },
  },
  addresses: true,
} as const;
export function userView(u: any) {
  const { passwordHash, provider, deletedAt, ...safe } = u;
  const ratings =
    provider?.bookings?.flatMap((b: any) =>
      b.review ? [b.review.rating] : [],
    ) || [];
  return {
    ...safe,
    role: u.role.toLowerCase(),
    ...(provider
      ? {
          businessName: provider.businessName,
          serviceArea: provider.serviceArea,
          skills: provider.skills,
          documentName: provider.documentName,
          verificationStatus: provider.verificationStatus,
          verificationFeedback: provider.verificationFeedback,
          weeklyAvailability: provider.availability,
          reviewCount: ratings.length,
          rating: ratings.length
            ? ratings.reduce((sum: number, rating: number) => sum + rating, 0) /
              ratings.length
            : null,
        }
      : {}),
  };
}
export const listingInclude = {
  category: true,
  provider: { include: { user: true } },
  bookings: { select: { review: true } },
} as const;
export function listingView(s: any) {
  const {
    provider,
    category,
    bookings,
    priceMinor,
    durationMinutes,
    deletedAt,
    ...v
  } = s;
  const reviews = bookings?.map((b: any) => b.review).filter(Boolean) || [];
  return {
    ...v,
    price: priceMinor / 100,
    duration: `${durationMinutes} mins`,
    categoryName: category.name,
    providerName: provider.businessName,
    providerVerificationStatus: provider.verificationStatus,
    reviewCount: reviews.length,
    rating: reviews.length
      ? reviews.reduce((n: number, r: any) => n + r.rating, 0) / reviews.length
      : null,
  };
}
export const disputeInclude = {
  booking: { include: { payment: true } },
  arbitrator: { select: { name: true } },
  hearing: true,
  ruling: true,
  evidences: {
    include: {
      file: { include: { owner: { select: { name: true, role: true } } } },
    },
  },
} as const;
export function rulingView(r: any) {
  if (!r) return null;
  const { awardMinor, ...v } = r;
  return { ...v, awardAmount: awardMinor / 100 };
}
export function disputeView(d: any) {
  const { booking, arbitrator, hearing, ruling, claimMinor, evidences, ...v } =
    d;
  return {
    ...v,
    customerId: booking.customerId,
    providerId: booking.providerId,
    customerName: booking.customerName,
    providerName: booking.providerName,
    serviceTitle: booking.serviceTitle,
    amountInDispute: booking.payment.amountMinor / 100,
    claimAmount: claimMinor / 100,
    arbitratorName: arbitrator?.name,
    hearingSchedule: hearing,
    ruling: rulingView(ruling),
    evidences: evidences.map((e: any) => ({
      id: e.id,
      fileId: e.fileId,
      title: e.title,
      filename: e.file.filename,
      fileType: e.file.mime,
      fileSize: e.file.size,
      uploader: `${e.file.owner?.name} (${e.file.owner?.role.toLowerCase()})`,
      uploaderRole: e.file.owner?.role.toLowerCase(),
      uploadedAt: e.file.createdAt,
      url: `/api/v1/uploads/${e.fileId}`,
    })),
  };
}
export const bookingInclude = {
  payment: true,
  timeline: { orderBy: { time: "asc" } },
  proposals: { where: { status: "pending" } },
  review: true,
  tickets: true,
  disputes: {
    orderBy: { createdAt: "desc" },
    include: { hearing: true, ruling: true },
  },
} as const;
export function bookingView(b: any) {
  const {
    payment,
    timeline,
    proposals,
    review,
    tickets,
    disputes,
    durationMinutes,
    requestKey,
    ...v
  } = b;
  const d = disputes?.[0];
  return {
    ...v,
    duration: `${durationMinutes} mins`,
    amount: payment.amountMinor / 100,
    platformFee: payment.feeMinor / 100,
    netPayout: payment.payoutMinor / 100,
    refundedAmount: payment.refundedMinor / 100,
    paymentMethod: payment.method,
    paymentStatus: payment.status,
    simulated: true,
    timeline,
    timeProposal: proposals?.[0] || null,
    reviewSubmitted: !!review,
    reviewRating: review?.rating,
    reviewComment: review?.comment,
    reviewReply: review?.reply,
    reviewDate: review?.createdAt,
    hasTicket: tickets?.some((t: any) => t.status !== "resolved"),
    hasDispute: disputes?.some((d: any) => d.status !== "ruled"),
    disputeId: d?.id,
    hearingSchedule: d?.hearing,
    ruling: rulingView(d?.ruling),
    disputeRuling: rulingView(d?.ruling),
  };
}
export function ticketView(t: any) {
  const { booking, ...v } = t;
  return {
    ...v,
    customerId: booking.customerId,
    providerId: booking.providerId,
    customerName: booking.customerName,
    providerName: booking.providerName,
    serviceTitle: booking.serviceTitle,
  };
}
