import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  calculateCancellationRefund,
  calculateRefundLedgerUpdate,
  computeNetPayout,
  computePlatformFee,
  isAccepted,
  isLocationCovered,
  isPaid,
  isPending,
} from '../finance/booking-rules.util';
import { availableSlots, scheduledSlotStartDate } from './scheduling.util';

@Injectable()
export class BookingsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async autoCancelOverduePendingBookings(now = new Date()) {
    const pendingJobs = await this.prisma.booking.findMany({
      where: { status: 'active', acceptedAt: null },
      include: { paymentLedger: true },
    });

    const overdueJobs = pendingJobs.filter((job) => {
      if (isAccepted(job)) return false;
      const start = job.scheduledStart || scheduledSlotStartDate(job.scheduledDate, job.scheduledSlot);
      return Boolean(start && now.getTime() >= start.getTime());
    });

    for (const job of overdueJobs) {
      await this.prisma.$transaction(async (tx) => {
        const fresh = await tx.booking.findUnique({
          where: { id: job.id },
          include: { paymentLedger: true },
        });
        if (!fresh || fresh.status !== 'active' || isAccepted(fresh)) return;

        const nowIso = now.toISOString();
        let refundNote = '';

        if (fresh.paymentLedger && isPaid(fresh.paymentLedger.paymentStatus)) {
          const refundData = calculateRefundLedgerUpdate(
            fresh.paymentLedger.grossAmountInr,
            fresh.paymentLedger.refundedAmountInr,
            fresh.paymentLedger.paymentStatus,
            fresh.amountInr,
            0,
          );
          if (refundData) {
            await tx.paymentLedger.update({ where: { id: fresh.paymentLedger.id }, data: refundData });
          }
          await tx.account.update({
            where: { id: fresh.customerId },
            data: { walletBalanceInr: { increment: fresh.amountInr } },
          });
          await tx.walletTransaction.create({
            data: {
              id: `wtxn-${crypto.randomUUID().slice(0, 8)}`,
              accountId: fresh.customerId,
              bookingId: fresh.id,
              type: 'REFUND',
              direction: 'CREDIT',
              amountInr: fresh.amountInr,
              grossAmountInr: fresh.amountInr,
              platformFeeInr: 0,
              netAmountInr: fresh.amountInr,
              cancellationChargeInr: 0,
              status: 'Refunded',
              description: `100% Auto-Cancellation Refund (Provider did not accept before job time) for #${fresh.id}`,
            },
          });
          refundNote = ` Full refund of ₹${fresh.amountInr} credited to customer wallet.`;
        } else if (fresh.paymentLedger?.paymentStatus === 'Pending') {
          await tx.paymentLedger.update({
            where: { id: fresh.paymentLedger.id },
            data: { paymentStatus: 'Cancelled' },
          });
        }

        const nextTimeline = Array.isArray(fresh.timeline) ? [...(fresh.timeline as any[])] : [];
        nextTimeline.push({
          time: nowIso,
          title: 'Auto-Cancelled (Unaccepted)',
          desc: `Provider did not accept before scheduled slot (${fresh.scheduledDate} ${fresh.scheduledSlot}).${refundNote}`,
        });

        await tx.booking.update({
          where: { id: fresh.id },
          data: { status: 'cancelled', timeProposal: null, timeline: nextTimeline },
        });

        await tx.notification.createMany({
          data: [
            {
              id: `notif-${crypto.randomUUID().slice(0, 8)}`,
              userId: fresh.customerId,
              type: 'BOOKING',
              title: 'Booking Auto-Cancelled',
              message: `${fresh.serviceTitle} was auto-cancelled as the provider did not accept before job time.${refundNote}`,
              targetLink: `/customer/bookings/${fresh.id}`,
            },
            {
              id: `notif-${crypto.randomUUID().slice(0, 8)}`,
              userId: fresh.providerId,
              type: 'BOOKING',
              title: 'Booking Auto-Cancelled (Missed)',
              message: `${fresh.serviceTitle} (#${fresh.id}) expired unaccepted at ${fresh.scheduledDate} ${fresh.scheduledSlot}.`,
              targetLink: `/provider/jobs/${fresh.id}`,
            },
          ],
        });
      });
    }
  }

  async findAllBookings(role?: string, userId?: string) {
    await this.autoCancelOverduePendingBookings();
    const where: any = {};
    if (role === 'customer' && userId) where.customerId = userId;
    else if (role === 'provider' && userId) where.providerId = userId;

    return this.prisma.booking.findMany({
      where,
      include: { paymentLedger: true, review: true, dispute: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findBookingById(id: string) {
    await this.autoCancelOverduePendingBookings();
    return this.prisma.booking.findUnique({
      where: { id },
      include: { paymentLedger: true, review: true, dispute: true },
    });
  }

  async getAvailableSlotsContext(serviceId: string) {
    const [service, services, bookings] = await Promise.all([
      this.prisma.serviceListing.findUnique({ where: { id: serviceId }, include: { provider: true } }),
      this.prisma.serviceListing.findMany(),
      this.prisma.booking.findMany(),
    ]);
    return { service, provider: service?.provider || null, services, bookings };
  }

  async createBookingTransaction(values: any) {
    return this.prisma.$transaction(async (tx) => {
      const [service, services, bookings, customerAccount] = await Promise.all([
        tx.serviceListing.findUnique({ where: { id: values.serviceId }, include: { provider: { include: { account: true } } } }),
        tx.serviceListing.findMany(),
        tx.booking.findMany(),
        tx.account.findUnique({ where: { id: values.customerId }, include: { customerProfile: { include: { addresses: true } } } }),
      ]);

      if (!service) return { error: 'Service not found.' };
      if (!service.provider) return { error: 'Provider not found.' };

      const customerLocation = {
        city: values.customerCity || values.addressSnapshot?.city || customerAccount?.city || customerAccount?.location,
        pincode: values.customerPincode || values.addressSnapshot?.pincode || values.addressSnapshot?.pinCode,
        address: values.address,
      };
      if (!isLocationCovered(service.provider, customerLocation)) {
        return {
          error:
            'This service is currently unavailable in your location. Please change your location or select a service provider operating in your area.',
        };
      }

      const openSlots = availableSlots(service, service.provider, values.scheduledDate, bookings, services);
      if (!openSlots.includes(values.scheduledSlot)) {
        return { error: 'This time is unavailable. Choose another available slot.' };
      }

      if (values.amount !== undefined && Number(values.amount) !== Number(service.priceInr)) {
        return { error: 'The service price changed. Review the listing before booking.' };
      }

      const amount = Number(service.priceInr);
      const fee = computePlatformFee(amount);
      const payout = computeNetPayout(amount);
      const isCash = values.paymentMethod === 'Cash After Service';
      const isWalletPay = values.paymentMethod === 'ServiceHub Wallet';

      if (isWalletPay) {
        if (!customerAccount || customerAccount.walletBalanceInr < amount) {
          return {
            error: `Insufficient wallet balance (₹${customerAccount?.walletBalanceInr ?? 0}). Top up your wallet or choose another payment method.`,
          };
        }
        await tx.account.update({
          where: { id: customerAccount.id },
          data: { walletBalanceInr: { decrement: amount } },
        });
      }

      const paymentStatus = isCash ? 'Pending' : 'Paid';
      const bookingId = `BK-${crypto.randomUUID().slice(0, 8)}`;
      const now = new Date();
      const nowStr = now.toISOString();
      const freeCancellationHours = service.freeCancellationHours ?? 2;
      const cancellationFeePercent = service.cancellationFeePercent ?? 20;
      const scheduledStart = scheduledSlotStartDate(values.scheduledDate, values.scheduledSlot);

      const timeline = [
        {
          time: nowStr,
          title: 'Booking Requested',
          desc: isCash
            ? 'Cash payment is due after service.'
            : isWalletPay
              ? `Wallet payment of ₹${amount} debited.`
              : `Mock payment of ₹${amount} recorded.`,
        },
        {
          time: nowStr,
          title: 'Awaiting Provider Acceptance',
          desc: `${service.provider.businessName} received the request. Free cancellation applies until accepted or scheduled job start.`,
        },
      ];

      const created = await tx.booking.create({
        data: {
          id: bookingId,
          bookingCode: bookingId,
          serviceId: service.id,
          serviceTitle: service.title,
          categoryName: service.categoryName,
          customerId: values.customerId,
          customerName: values.customerName.trim(),
          customerPhone: values.customerPhone || '',
          providerId: service.provider.id,
          providerName: service.provider.businessName,
          providerPhone: service.provider.account?.phone || '',
          address: values.address.trim(),
          addressSnapshot: values.addressSnapshot || { formatted: values.address.trim(), city: customerLocation.city, pincode: customerLocation.pincode },
          scheduledDate: values.scheduledDate,
          scheduledSlot: values.scheduledSlot,
          scheduledStart,
          duration: service.duration,
          amountInr: amount,
          freeCancellationHours,
          cancellationFeePercent,
          freeCancellationUntil: null,
          status: 'active',
          notes: values.notes || '',
          timeline,
          paymentLedger: {
            create: {
              id: `pay-${bookingId}`,
              grossAmountInr: amount,
              platformFeeInr: fee,
              providerNetPayoutInr: payout,
              refundedAmountInr: 0,
              cancellationFeeInr: 0,
              arbitratorFeeInr: 0,
              paymentMethod: values.paymentMethod || 'UPI (Mock Pay)',
              paymentStatus,
            },
          },
        },
        include: { paymentLedger: true, review: true, dispute: true },
      });

      await tx.walletTransaction.create({
        data: {
          id: `wtxn-${crypto.randomUUID().slice(0, 8)}`,
          accountId: values.customerId,
          bookingId: created.id,
          type: 'BOOKING_PAYMENT',
          direction: 'DEBIT',
          amountInr: amount,
          grossAmountInr: amount,
          platformFeeInr: fee,
          netAmountInr: payout,
          status: isCash ? 'Pending' : 'Successful',
          description: `Payment (${values.paymentMethod || 'UPI'}) for ${service.title} (#${created.id})`,
        },
      });

      await tx.notification.createMany({
        data: [
          {
            id: `notif-${crypto.randomUUID().slice(0, 8)}`,
            userId: service.provider.id,
            type: 'BOOKING',
            title: 'New Job Request',
            message: `${created.customerName} booked ${created.serviceTitle} for ${created.scheduledDate} at ${created.scheduledSlot}. Payment: ${paymentStatus}.`,
            targetLink: `/provider/jobs/${created.id}`,
          },
          {
            id: `notif-${crypto.randomUUID().slice(0, 8)}`,
            userId: 'user-admin-1',
            type: 'BOOKING',
            title: 'New Job Request',
            message: `${created.customerName} booked ${created.serviceTitle} for ${created.scheduledDate} at ${created.scheduledSlot}. Payment: ${paymentStatus}.`,
            targetLink: '/admin/bookings',
          },
        ],
      });

      return { booking: created };
    });
  }

  async updateStatusTransaction(bookingId: string, status: string, note: string, actor: any) {
      await this.autoCancelOverduePendingBookings();
      return this.prisma.$transaction(async (tx) => {
      const job = await tx.booking.findUnique({
        where: { id: bookingId },
        include: { paymentLedger: true, review: true, dispute: true },
      });
      if (!job) return { error: 'Booking not found.', statusCode: 404 };

      if (actor.role === 'provider' && job.providerId !== actor.id) {
        return { error: 'This record does not belong to your account.', statusCode: 403 };
      }
      if (actor.role === 'customer') {
        if (job.customerId !== actor.id) return { error: 'This record does not belong to your account.', statusCode: 403 };
        if (status !== 'cancelled') return { error: 'Customers can only cancel through this action.', statusCode: 400 };
        if (['in_progress', 'completed'].includes(job.status)) {
          return {
            error: 'Bookings cannot be cancelled once the provider has started (In Progress) or completed the job.',
            statusCode: 400,
          };
        }
      }
      if (actor.role === 'provider' && status === 'cancelled' && !isPending(job)) {
        return { error: 'Only pending requests can be declined.', statusCode: 400 };
      }
      if (actor.expectedStatus && job.status !== actor.expectedStatus) {
        return { error: 'This booking has changed. Refresh before acting.', statusCode: 409 };
      }

      const allowed: Record<string, boolean> = {
        active: job.status === 'active' && !isAccepted(job),
        in_progress: job.status === 'active' && isAccepted(job),
        completed: job.status === 'in_progress',
        cancelled: ['active', 'reschedule_proposed'].includes(job.status),
      };
      if (!allowed[status]) {
        return { error: 'This booking has changed or the action is not allowed.', statusCode: 400 };
      }
      if (status === 'completed' && !note?.trim()) {
        return { error: 'Enter completion notes.', statusCode: 400 };
      }

      const now = new Date();
      const nowIso = now.toISOString();
      const nextTimeline = Array.isArray(job.timeline) ? [...(job.timeline as any[])] : [];
      const bookingUpdates: any = { status };

      if (status === 'active') {
        const freeHrs = job.freeCancellationHours ?? 2;
        bookingUpdates.acceptedAt = now;
        bookingUpdates.freeCancellationUntil = new Date(now.getTime() + freeHrs * 3600 * 1000);
      }

      if (status === 'completed') {
        if (job.paymentLedger?.paymentStatus === 'Pending') {
          await tx.paymentLedger.update({
            where: { id: job.paymentLedger.id },
            data: { paymentStatus: 'Paid' },
          });
          await tx.walletTransaction.updateMany({
            where: { bookingId: job.id, accountId: job.customerId, type: 'BOOKING_PAYMENT', status: 'Pending' },
            data: { status: 'Successful' },
          });
          nextTimeline.push({
            time: nowIso,
            title: 'Cash Payment Recorded',
            desc: 'Mock cash payment recorded on completion.',
          });
        }

        const fee = job.paymentLedger?.platformFeeInr ?? computePlatformFee(job.amountInr);
        const payout = job.paymentLedger?.providerNetPayoutInr ?? computeNetPayout(job.amountInr);
        await tx.account.update({
          where: { id: job.providerId },
          data: { walletBalanceInr: { increment: payout } },
        });
        await tx.walletTransaction.create({
          data: {
            id: `wtxn-${crypto.randomUUID().slice(0, 8)}`,
            accountId: job.providerId,
            bookingId: job.id,
            type: 'PROVIDER_PAYOUT',
            direction: 'CREDIT',
            amountInr: payout,
            grossAmountInr: job.amountInr,
            platformFeeInr: fee,
            netAmountInr: payout,
            status: 'Successful',
            description: `Net Payout (95%) for ${job.serviceTitle} (#${job.id})`,
          },
        });
        await tx.account.update({
          where: { id: 'user-admin-1' },
          data: { walletBalanceInr: { increment: fee } },
        });
        await tx.walletTransaction.create({
          data: {
            id: `wtxn-${crypto.randomUUID().slice(0, 8)}`,
            accountId: 'user-admin-1',
            bookingId: job.id,
            type: 'PLATFORM_FEE',
            direction: 'CREDIT',
            amountInr: fee,
            grossAmountInr: job.amountInr,
            platformFeeInr: fee,
            netAmountInr: fee,
            status: 'Successful',
            description: `5% Platform fee for ${job.serviceTitle} (#${job.id})`,
          },
        });
      }

      let cancellationSummaryNote = '';
      if (status === 'cancelled') {
        if (job.paymentLedger && isPaid(job.paymentLedger.paymentStatus)) {
          const policyCalc =
            actor.role === 'customer' && isAccepted(job)
              ? calculateCancellationRefund(
                  job.amountInr,
                  job.freeCancellationUntil,
                  job.cancellationFeePercent ?? 20,
                )
              : { withinFreeWindow: true, feePercent: 0, cancellationChargeInr: 0, refundAmountInr: job.amountInr };

          const refundData = calculateRefundLedgerUpdate(
            job.paymentLedger.grossAmountInr,
            job.paymentLedger.refundedAmountInr,
            job.paymentLedger.paymentStatus,
            policyCalc.refundAmountInr,
            policyCalc.cancellationChargeInr,
          );

          if (refundData) {
            await tx.paymentLedger.update({ where: { id: job.paymentLedger.id }, data: refundData });
          }

          if (policyCalc.refundAmountInr > 0) {
            await tx.account.update({
              where: { id: job.customerId },
              data: { walletBalanceInr: { increment: policyCalc.refundAmountInr } },
            });
            await tx.walletTransaction.create({
              data: {
                id: `wtxn-${crypto.randomUUID().slice(0, 8)}`,
                accountId: job.customerId,
                bookingId: job.id,
                type: 'REFUND',
                direction: 'CREDIT',
                amountInr: policyCalc.refundAmountInr,
                grossAmountInr: job.amountInr,
                platformFeeInr: 0,
                netAmountInr: policyCalc.refundAmountInr,
                cancellationChargeInr: policyCalc.cancellationChargeInr,
                status: 'Refunded',
                description: policyCalc.withinFreeWindow
                  ? `100% Free-Window Refund to Wallet for #${job.id}`
                  : `Cancellation Refund (₹${policyCalc.cancellationChargeInr} late fee deducted) to Wallet for #${job.id}`,
              },
            });
          }

          if (policyCalc.cancellationChargeInr > 0) {
            const adminCut = Math.round(policyCalc.cancellationChargeInr * 0.05);
            const providerCut = policyCalc.cancellationChargeInr - adminCut;
            await tx.account.update({
              where: { id: job.providerId },
              data: { walletBalanceInr: { increment: providerCut } },
            });
            await tx.walletTransaction.create({
              data: {
                id: `wtxn-${crypto.randomUUID().slice(0, 8)}`,
                accountId: job.providerId,
                bookingId: job.id,
                type: 'CANCELLATION_FEE',
                direction: 'CREDIT',
                amountInr: providerCut,
                grossAmountInr: policyCalc.cancellationChargeInr,
                platformFeeInr: adminCut,
                netAmountInr: providerCut,
                cancellationChargeInr: policyCalc.cancellationChargeInr,
                status: 'Successful',
                description: `Provider share (95%) of late cancellation charge for #${job.id}`,
              },
            });
            await tx.account.update({
              where: { id: 'user-admin-1' },
              data: { walletBalanceInr: { increment: adminCut } },
            });
            await tx.walletTransaction.create({
              data: {
                id: `wtxn-${crypto.randomUUID().slice(0, 8)}`,
                accountId: 'user-admin-1',
                bookingId: job.id,
                type: 'CANCELLATION_FEE',
                direction: 'CREDIT',
                amountInr: adminCut,
                grossAmountInr: policyCalc.cancellationChargeInr,
                platformFeeInr: adminCut,
                netAmountInr: adminCut,
                cancellationChargeInr: policyCalc.cancellationChargeInr,
                status: 'Successful',
                description: `Platform 5% share of cancellation charge for #${job.id}`,
              },
            });
          }

          cancellationSummaryNote = policyCalc.withinFreeWindow
            ? ` Refunded ₹${policyCalc.refundAmountInr} to customer wallet (free cancellation window).`
            : ` Cancellation fee: ₹${policyCalc.cancellationChargeInr} (${policyCalc.feePercent}%). Refunded ₹${policyCalc.refundAmountInr} to customer wallet.`;
        } else if (job.paymentLedger?.paymentStatus === 'Pending') {
          await tx.paymentLedger.update({
            where: { id: job.paymentLedger.id },
            data: { paymentStatus: 'Cancelled' },
          });
          await tx.walletTransaction.updateMany({
            where: { bookingId: job.id, accountId: job.customerId, status: 'Pending' },
            data: { status: 'Refunded' },
          });
        }
        bookingUpdates.timeProposal = null;
      }

      nextTimeline.push({
        time: nowIso,
        title: status === 'active' ? 'Booking Accepted' : `Status: ${status.replaceAll('_', ' ')}`,
        desc: `${note?.trim() || `Booking ${status.replaceAll('_', ' ')}.`}${cancellationSummaryNote}`,
      });
      bookingUpdates.timeline = nextTimeline;

      const updated = await tx.booking.update({
        where: { id: bookingId },
        data: bookingUpdates,
        include: { paymentLedger: true, review: true, dispute: true },
      });

      const title = `Booking ${status === 'active' ? 'Accepted' : status.replaceAll('_', ' ')}`;
      const msg = `${job.serviceTitle}: ${note?.trim() || status}.${cancellationSummaryNote}`;
      await tx.notification.createMany({
        data: [
          {
            id: `notif-${crypto.randomUUID().slice(0, 8)}`,
            userId: job.providerId,
            type: 'BOOKING',
            title,
            message: msg,
            targetLink: `/provider/jobs/${job.id}`,
          },
          {
            id: `notif-${crypto.randomUUID().slice(0, 8)}`,
            userId: job.customerId,
            type: 'BOOKING',
            title,
            message: msg,
            targetLink: `/customer/bookings/${job.id}`,
          },
        ],
      });

      return { booking: updated };
    });
  }

  async proposeTimeTransaction(bookingId: string, date: string, slot: string, providerId: string) {
    return this.prisma.$transaction(async (tx) => {
      const [job, services, bookings] = await Promise.all([
        tx.booking.findUnique({ where: { id: bookingId }, include: { paymentLedger: true, review: true, dispute: true } }),
        tx.serviceListing.findMany(),
        tx.booking.findMany(),
      ]);
      if (!job) return { error: 'Booking not found.' };
      if (job.providerId !== providerId) return { error: 'This record does not belong to your account.' };
      if (job.status !== 'active') return { error: 'Only active bookings can be rescheduled.' };
      if (date === job.scheduledDate && slot === job.scheduledSlot) return { error: 'Choose a different date or time.' };

      const service = services.find((s) => s.id === job.serviceId);
      const provider = await tx.providerProfile.findUnique({ where: { id: providerId } });
      if (!service || !provider) return { error: 'Service or Provider not found.' };
      if (!availableSlots(service, provider, date, bookings, services, job.id).includes(slot)) {
        return { error: 'The proposed time is unavailable.' };
      }

      const nowIso = new Date().toISOString();
      const nextTimeline = Array.isArray(job.timeline) ? [...(job.timeline as any[])] : [];
      nextTimeline.push({
        time: nowIso,
        title: 'Alternative Time Proposed',
        desc: `${date} at ${slot}. The original schedule remains reserved until the customer agrees.`,
      });

      const updated = await tx.booking.update({
        where: { id: bookingId },
        data: {
          status: 'reschedule_proposed',
          timeProposal: { date, slot, createdAt: nowIso },
          timeline: nextTimeline,
        },
        include: { paymentLedger: true, review: true, dispute: true },
      });

      await tx.notification.create({
        data: {
          id: `notif-${crypto.randomUUID().slice(0, 8)}`,
          userId: job.customerId,
          type: 'BOOKING',
          title: 'Please Review a Time Proposal',
          message: `${job.providerName} proposed ${date} at ${slot} for ${job.serviceTitle}.`,
          targetLink: `/customer/bookings/${job.id}`,
        },
      });

      return { booking: updated };
    });
  }

  async respondTimeProposalTransaction(bookingId: string, accept: boolean, customerId: string) {
    return this.prisma.$transaction(async (tx) => {
      const [job, services, bookings] = await Promise.all([
        tx.booking.findUnique({ where: { id: bookingId }, include: { paymentLedger: true, review: true, dispute: true } }),
        tx.serviceListing.findMany(),
        tx.booking.findMany(),
      ]);
      if (!job) return { error: 'Booking not found.' };
      if (job.customerId !== customerId) return { error: 'This record does not belong to your account.' };
      const proposal = job.timeProposal as any;
      if (job.status !== 'reschedule_proposed' || !proposal) {
        return { error: 'This proposal is no longer available.' };
      }

      let nextDate = job.scheduledDate;
      let nextSlot = job.scheduledSlot;
      let acceptedAt = job.acceptedAt;

      if (accept) {
        const service = services.find((s) => s.id === job.serviceId);
        const provider = await tx.providerProfile.findUnique({ where: { id: job.providerId } });
        if (!service || !provider) return { error: 'Service or Provider not found.' };
        if (!availableSlots(service, provider, proposal.date, bookings, services, job.id).includes(proposal.slot)) {
          return { error: 'This time was booked elsewhere. Decline the proposal or ask for a new time.' };
        }
        nextDate = proposal.date;
        nextSlot = proposal.slot;
        acceptedAt = new Date();
      }

      const nowIso = new Date().toISOString();
      const nextTimeline = Array.isArray(job.timeline) ? [...(job.timeline as any[])] : [];
      nextTimeline.push({
        time: nowIso,
        title: accept ? 'Reschedule Confirmed' : 'Time Proposal Declined',
        desc: accept
          ? `Customer agreed to ${nextDate} at ${nextSlot}.`
          : 'The original schedule remains unchanged.',
      });

      const updated = await tx.booking.update({
        where: { id: bookingId },
        data: {
          scheduledDate: nextDate,
          scheduledSlot: nextSlot,
          acceptedAt,
          status: 'active',
          timeProposal: null,
          timeline: nextTimeline,
        },
        include: { paymentLedger: true, review: true, dispute: true },
      });

      const title = accept ? 'Reschedule Confirmed' : 'Time Proposal Declined';
      const msg = `${job.serviceTitle}: ${nextDate} at ${nextSlot}.`;
      await tx.notification.createMany({
        data: [
          {
            id: `notif-${crypto.randomUUID().slice(0, 8)}`,
            userId: job.providerId,
            type: 'BOOKING',
            title,
            message: msg,
            targetLink: `/provider/jobs/${job.id}`,
          },
          {
            id: `notif-${crypto.randomUUID().slice(0, 8)}`,
            userId: job.customerId,
            type: 'BOOKING',
            title,
            message: msg,
            targetLink: `/customer/bookings/${job.id}`,
          },
        ],
      });

      return { booking: updated };
    });
  }

  deleteBooking(id: string) {
    return this.prisma.booking.delete({ where: { id } });
  }
}
