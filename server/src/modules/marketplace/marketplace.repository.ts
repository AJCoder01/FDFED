import { Injectable } from '@nestjs/common';
import { ServiceStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class MarketplaceRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAllCategories() {
    return this.prisma.category.findMany({ orderBy: { id: 'asc' } });
  }

  findCategoryById(id: string) {
    return this.prisma.category.findUnique({ where: { id } });
  }

  createCategory(data: { id: string; name: string; slug: string; icon?: string; description?: string; enabled?: boolean }) {
    return this.prisma.category.create({ data });
  }

  updateCategory(id: string, data: any) {
    return this.prisma.category.update({ where: { id }, data });
  }

  deleteCategory(id: string) {
    return this.prisma.category.delete({ where: { id } });
  }

  findAllServices() {
    return this.prisma.serviceListing.findMany({
      include: { provider: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  findServiceById(id: string) {
    return this.prisma.serviceListing.findUnique({
      where: { id },
      include: { provider: true },
    });
  }

  findAllReviews() {
    return this.prisma.review.findMany({ orderBy: { createdAt: 'desc' } });
  }

  findReviewsByService(serviceId: string) {
    return this.prisma.review.findMany({
      where: { serviceId },
      orderBy: { createdAt: 'desc' },
    });
  }

  findProviderById(providerId: string) {
    return this.prisma.providerProfile.findUnique({ where: { id: providerId } });
  }

  upsertService(data: {
    id: string;
    isUpdate: boolean;
    providerId: string;
    categoryId: string;
    categoryName: string;
    providerName: string;
    title: string;
    description: string;
    priceInr: number;
    durationMinutes: number;
    duration: string;
    mode: string;
    image: string;
    inclusions: string[];
    exclusions: string[];
    policy: string;
    freeCancellationHours?: number;
    cancellationFeePercent?: number;
    availableSlots: string[];
    status: ServiceStatus;
  }) {
    const payload = {
      providerId: data.providerId,
      categoryId: data.categoryId,
      categoryName: data.categoryName,
      providerName: data.providerName,
      title: data.title,
      description: data.description,
      priceInr: data.priceInr,
      durationMinutes: data.durationMinutes,
      duration: data.duration,
      mode: data.mode,
      image: data.image,
      inclusions: data.inclusions,
      exclusions: data.exclusions,
      policy: data.policy,
      freeCancellationHours: data.freeCancellationHours ?? 2,
      cancellationFeePercent: data.cancellationFeePercent ?? 20,
      availableSlots: data.availableSlots,
      status: data.status,
    };
    if (data.isUpdate) {
      return this.prisma.serviceListing.update({
        where: { id: data.id },
        data: payload,
        include: { provider: true },
      });
    }
    return this.prisma.serviceListing.create({
      data: { id: data.id, ...payload },
      include: { provider: true },
    });
  }

  deleteService(serviceId: string) {
    return this.prisma.serviceListing.delete({ where: { id: serviceId } });
  }

  async createReviewForBooking(bookingId: string, customerId: string, rating: number, comment: string) {
    return this.prisma.$transaction(async (tx) => {
      const booking = await tx.booking.findUnique({ where: { id: bookingId }, include: { review: true } });
      if (!booking) return { error: 'Booking not found.' };
      if (booking.customerId !== customerId) return { error: 'This record does not belong to your account.' };
      if (booking.status !== 'completed' || booking.review) {
        return { error: 'Only completed, unreviewed bookings can be reviewed.' };
      }

      const review = await tx.review.create({
        data: {
          id: `rev-${crypto.randomUUID().slice(0, 8)}`,
          bookingId: booking.id,
          customerId,
          providerId: booking.providerId,
          serviceId: booking.serviceId,
          customerName: booking.customerName,
          rating,
          comment: comment.trim(),
        },
      });

      await tx.notification.create({
        data: {
          id: `notif-${crypto.randomUUID().slice(0, 8)}`,
          userId: booking.providerId,
          type: 'REVIEW',
          title: 'New Customer Review',
          message: `${booking.customerName} rated ${booking.serviceTitle} ${rating}/5.`,
          targetLink: '/provider/reviews',
        },
      });

      const updatedBooking = await tx.booking.findUnique({
        where: { id: booking.id },
        include: { paymentLedger: true, review: true, dispute: true },
      });
      return { review, booking: updatedBooking };
    });
  }

  async replyToBookingReview(bookingId: string, providerId: string, reply: string, isAdmin = false) {
    return this.prisma.$transaction(async (tx) => {
      const booking = await tx.booking.findUnique({ where: { id: bookingId }, include: { review: true } });
      if (!booking || !booking.review) return { error: 'Review not found.' };
      if (!isAdmin && booking.providerId !== providerId) {
        return { error: 'This record does not belong to your account.' };
      }

      await tx.review.update({
        where: { id: booking.review.id },
        data: { reply: reply.trim(), repliedAt: new Date() },
      });

      await tx.notification.create({
        data: {
          id: `notif-${crypto.randomUUID().slice(0, 8)}`,
          userId: booking.customerId,
          type: 'REVIEW',
          title: 'Provider Replied to Your Review',
          message: reply.trim(),
          targetLink: `/customer/bookings/${booking.id}`,
        },
      });

      const updatedBooking = await tx.booking.findUnique({
        where: { id: booking.id },
        include: { paymentLedger: true, review: true, dispute: true },
      });
      return { booking: updatedBooking };
    });
  }

  findJobRequests(customerId?: string) {
    return this.prisma.bespokeJobRequest.findMany({
      where: customerId ? { customerId } : undefined,
      orderBy: { createdAt: 'desc' },
    });
  }

  createJobRequest(data: {
    id: string;
    requestCode: string;
    customerId: string;
    categoryId?: string;
    categoryName: string;
    title: string;
    description: string;
    location: string;
    budgetInr: number;
    preferredDate: string;
    contactName: string;
    contactPhone: string;
  }) {
    return this.prisma.bespokeJobRequest.create({ data });
  }

  deleteJobRequest(id: string) {
    return this.prisma.bespokeJobRequest.delete({ where: { id } });
  }
}
