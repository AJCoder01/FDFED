import { Injectable } from '@nestjs/common';
import { AccountRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../prisma/prisma.service';
import { calculateRefundLedgerUpdate } from '../finance/booking-rules.util';
import { DEFAULT_BLANK_AVATAR, DEFAULT_DEMO_PASSWORD } from '../../../prisma/seed-data';

@Injectable()
export class GovernanceRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAllTickets(role?: string, userId?: string) {
    const where: any = {};
    if (role === 'customer' && userId) where.creatorId = userId;
    else if (role === 'provider' && userId) where.providerId = userId;
    return this.prisma.supportTicket.findMany({ where, orderBy: { createdAt: 'desc' } });
  }

  findTicketById(id: string) {
    return this.prisma.supportTicket.findUnique({ where: { id } });
  }

  async createTicketTransaction(values: any, customerId: string) {
    return this.prisma.$transaction(async (tx) => {
      const booking = await tx.booking.findUnique({ where: { id: values.bookingId } });
      if (!booking) return { error: 'Booking not found.' };
      if (booking.customerId !== customerId) return { error: 'This record does not belong to your account.' };

      const ticketId = `TCK-${crypto.randomUUID().slice(0, 8)}`;
      const ticket = await tx.supportTicket.create({
        data: {
          id: ticketId,
          ticketCode: ticketId,
          creatorId: customerId,
          bookingId: booking.id,
          providerId: booking.providerId,
          serviceTitle: booking.serviceTitle,
          customerName: booking.customerName,
          providerName: booking.providerName,
          issueType: values.issueType || values.category || 'Service Quality Issue',
          severity: values.severity || values.priority || 'Medium',
          subject: values.subject || values.issueType || 'Support Request',
          category: values.category || values.issueType || 'General',
          priority: values.priority || values.severity || 'Medium',
          description: values.description.trim(),
          status: 'open',
          messages: values.messages || [],
        },
      });

      await tx.booking.update({ where: { id: booking.id }, data: { hasTicket: true } });

      await tx.notification.createMany({
        data: [
          {
            id: `notif-${crypto.randomUUID().slice(0, 8)}`,
            userId: 'user-admin-1',
            type: 'TICKET',
            title: 'Support Ticket Opened',
            message: `${booking.serviceTitle}: ${ticket.description}`,
            targetLink: '/admin/tickets',
          },
          {
            id: `notif-${crypto.randomUUID().slice(0, 8)}`,
            userId: booking.providerId,
            type: 'TICKET',
            title: 'Support Ticket Opened',
            message: `${booking.serviceTitle}: ${ticket.description}`,
            targetLink: `/provider/jobs/${booking.id}`,
          },
        ],
      });

      return { ticket };
    });
  }

  async resolveTicketTransaction(ticketId: string, outcome: string, notes = '') {
    return this.prisma.$transaction(async (tx) => {
      const ticket = await tx.supportTicket.findUnique({ where: { id: ticketId } });
      if (!ticket) return { error: 'Ticket not found.' };
      if (ticket.status === 'resolved') return { error: 'This ticket is already resolved.' };

      const booking = await tx.booking.findUnique({
        where: { id: ticket.bookingId },
        include: { paymentLedger: true, dispute: true },
      });
      if (!booking) return { error: 'Booking not found.' };

      const nowIso = new Date().toISOString();
      const nextTimeline = Array.isArray(booking.timeline) ? [...(booking.timeline as any[])] : [];
      const bookingUpdates: any = {};

      if (outcome === 'Escalated to Arbitration') {
        if (!['completed', 'in_progress'].includes(booking.status)) {
          return { error: 'A dispute can be filed for work in progress or a completed job.' };
        }
        if (booking.dispute && booking.dispute.status !== 'ruled') {
          return { error: 'This booking already has an open dispute.' };
        }
        const dispId = `DISP-${crypto.randomUUID().slice(0, 8)}`;
        await tx.dispute.create({
          data: {
            id: dispId,
            disputeCode: dispId,
            bookingId: booking.id,
            customerId: booking.customerId,
            providerId: booking.providerId,
            serviceTitle: booking.serviceTitle,
            customerName: booking.customerName,
            providerName: booking.providerName,
            amountInDispute: booking.amountInr,
            claimAmount: booking.amountInr,
            reason: ticket.issueType || 'Escalated Support Ticket',
            customerStatement: ticket.description,
            status: 'pending_assignment',
            evidences: [],
          },
        });
        bookingUpdates.statusBeforeDispute = booking.status;
        bookingUpdates.status = 'disputed';
        bookingUpdates.hasDispute = true;
        bookingUpdates.disputeId = dispId;
        nextTimeline.push({ time: nowIso, title: 'Dispute Filed', desc: ticket.description });
      }

      if (outcome === 'Full Mock Refund Issued' && booking.paymentLedger) {
        const update = calculateRefundLedgerUpdate(
          booking.paymentLedger.grossAmountInr,
          booking.paymentLedger.refundedAmountInr,
          booking.paymentLedger.paymentStatus,
          Number(booking.amountInr),
        );
        if (update) await tx.paymentLedger.update({ where: { id: booking.paymentLedger.id }, data: update });
      }

      if (outcome === 'Partial Refund (50%)' && booking.paymentLedger) {
        const update = calculateRefundLedgerUpdate(
          booking.paymentLedger.grossAmountInr,
          booking.paymentLedger.refundedAmountInr,
          booking.paymentLedger.paymentStatus,
          Math.round(Number(booking.amountInr) * 0.5),
        );
        if (update) await tx.paymentLedger.update({ where: { id: booking.paymentLedger.id }, data: update });
      }

      const updatedTicket = await tx.supportTicket.update({
        where: { id: ticketId },
        data: {
          status: 'resolved',
          resolutionOutcome: outcome,
          resolutionNotes: notes || outcome,
        },
      });

      const remainingOpen = await tx.supportTicket.count({
        where: { bookingId: booking.id, status: { not: 'resolved' } },
      });
      bookingUpdates.hasTicket = remainingOpen > 0;
      nextTimeline.push({ time: nowIso, title: 'Support Ticket Resolved', desc: outcome });
      bookingUpdates.timeline = nextTimeline;

      await tx.booking.update({ where: { id: booking.id }, data: bookingUpdates });

      await tx.notification.createMany({
        data: [
          {
            id: `notif-${crypto.randomUUID().slice(0, 8)}`,
            userId: booking.providerId,
            type: 'TICKET',
            title: 'Support Ticket Resolved',
            message: `${booking.serviceTitle}: ${outcome}.`,
            targetLink: `/provider/jobs/${booking.id}`,
          },
          {
            id: `notif-${crypto.randomUUID().slice(0, 8)}`,
            userId: booking.customerId,
            type: 'TICKET',
            title: 'Support Ticket Resolved',
            message: `${booking.serviceTitle}: ${outcome}.`,
            targetLink: `/customer/bookings/${booking.id}`,
          },
        ],
      });

      return { ticket: updatedTicket };
    });
  }

  deleteTicket(id: string) {
    return this.prisma.supportTicket.delete({ where: { id } });
  }

  findAllDisputes() {
    return this.prisma.dispute.findMany({ orderBy: { createdAt: 'desc' } });
  }

  findDisputeById(id: string) {
    return this.prisma.dispute.findUnique({ where: { id } });
  }

  async createDisputeTransaction(values: any, customerId: string) {
    return this.prisma.$transaction(async (tx) => {
      const booking = await tx.booking.findUnique({ where: { id: values.bookingId }, include: { dispute: true } });
      if (!booking) return { error: 'Booking not found.' };
      if (booking.customerId !== customerId) return { error: 'This record does not belong to your account.' };
      if (!['completed', 'in_progress'].includes(booking.status)) {
        return { error: 'A dispute can be filed for work in progress or a completed job.' };
      }
      if (booking.dispute && booking.dispute.status !== 'ruled') {
        return { error: 'This booking already has an open dispute.' };
      }

      const requestedClaim = Number(values.claimAmount);
      if (!Number.isFinite(requestedClaim) || requestedClaim <= 0 || requestedClaim > booking.amountInr) {
        return {
          error: `Claim amount (₹${requestedClaim}) cannot exceed the paid booking amount of ₹${booking.amountInr}.`,
        };
      }

      const dispId = `DISP-${crypto.randomUUID().slice(0, 8)}`;
      const dispute = await tx.dispute.create({
        data: {
          id: dispId,
          disputeCode: dispId,
          bookingId: booking.id,
          customerId: booking.customerId,
          providerId: booking.providerId,
          serviceTitle: booking.serviceTitle,
          customerName: booking.customerName,
          providerName: booking.providerName,
          amountInDispute: booking.amountInr,
          claimAmount: Number(values.claimAmount),
          reason: values.reason || 'Service Dispute',
          customerStatement: values.customerStatement.trim(),
          customerEvidence: values.evidences || [],
          evidences: values.evidences || [],
          status: 'pending_assignment',
        },
      });

      const nextTimeline = Array.isArray(booking.timeline) ? [...(booking.timeline as any[])] : [];
      nextTimeline.push({ time: new Date().toISOString(), title: 'Dispute Filed', desc: dispute.customerStatement });

      await tx.booking.update({
        where: { id: booking.id },
        data: {
          statusBeforeDispute: booking.status,
          status: 'disputed',
          hasDispute: true,
          disputeId: dispute.id,
          timeline: nextTimeline,
        },
      });

      await tx.notification.createMany({
        data: [
          {
            id: `notif-${crypto.randomUUID().slice(0, 8)}`,
            userId: booking.providerId,
            type: 'DISPUTE',
            title: 'Dispute Filed',
            message: `${booking.serviceTitle}: case ${dispute.id}.`,
            targetLink: `/provider/jobs/${booking.id}`,
          },
          {
            id: `notif-${crypto.randomUUID().slice(0, 8)}`,
            userId: 'user-admin-1',
            type: 'DISPUTE',
            title: 'Dispute Filed',
            message: `${booking.serviceTitle}: case ${dispute.id}.`,
            targetLink: '/admin/disputes',
          },
        ],
      });

      return { dispute };
    });
  }

  async assignDisputeTransaction(disputeId: string, arbitrator: { id: string; name: string }) {
    return this.prisma.$transaction(async (tx) => {
      const dispute = await tx.dispute.findUnique({ where: { id: disputeId } });
      if (!dispute) return { error: 'Dispute not found.' };
      if (dispute.status === 'ruled') return { error: 'A ruled case cannot be reassigned.' };

      const updated = await tx.dispute.update({
        where: { id: disputeId },
        data: {
          status: 'assigned',
          arbitratorId: arbitrator.id,
          arbitratorName: arbitrator.name,
        },
      });

      await tx.notification.createMany({
        data: [
          {
            id: `notif-${crypto.randomUUID().slice(0, 8)}`,
            userId: dispute.providerId,
            type: 'DISPUTE',
            title: 'Arbitrator Assigned',
            message: `${arbitrator.name} will review case ${dispute.id}.`,
            targetLink: `/provider/jobs/${dispute.bookingId}`,
          },
          {
            id: `notif-${crypto.randomUUID().slice(0, 8)}`,
            userId: dispute.customerId,
            type: 'DISPUTE',
            title: 'Arbitrator Assigned',
            message: `${arbitrator.name} will review case ${dispute.id}.`,
            targetLink: `/customer/bookings/${dispute.bookingId}`,
          },
          {
            id: `notif-${crypto.randomUUID().slice(0, 8)}`,
            userId: arbitrator.id,
            type: 'DISPUTE',
            title: 'Arbitrator Assigned',
            message: `${arbitrator.name} will review case ${dispute.id}.`,
            targetLink: `/arbitrator/cases/${dispute.id}`,
          },
        ],
      });

      return { dispute: updated };
    });
  }

  async saveDisputeResponseTransaction(disputeId: string, providerId: string, statement: string, filename: any) {
    return this.prisma.$transaction(async (tx) => {
      const dispute = await tx.dispute.findUnique({ where: { id: disputeId } });
      if (!dispute) return { error: 'Dispute not found.' };
      if (dispute.providerId !== providerId) return { error: 'This record does not belong to your account.' };
      if (dispute.status === 'ruled' || !statement.trim()) return { error: 'Enter a response for an open dispute.' };

      const evidences = Array.isArray(dispute.evidences) ? [...(dispute.evidences as any[])] : [];
      const providerEv = Array.isArray(dispute.providerEvidence) ? [...(dispute.providerEvidence as any[])] : [];
      const nowIso = new Date().toISOString();

      const addEvidence = (item: any) => {
        evidences.push(item);
        providerEv.push(item);
      };

      if (Array.isArray(filename)) {
        for (const fn of filename) {
          const name = typeof fn === 'object' ? fn.name || fn.filename : fn;
          if (name?.trim()) {
            addEvidence({
              id: `ev-${crypto.randomUUID().slice(0, 8)}`,
              uploader: `${dispute.providerName} (Provider)`,
              uploaderRole: 'provider',
              title: name.trim(),
              filename: name.trim(),
              fileData: typeof fn === 'object' ? fn.fileData || '' : '',
              fileType: typeof fn === 'object' ? fn.type || '' : '',
              fileSize: typeof fn === 'object' ? fn.size || '' : '',
              uploadedAt: nowIso,
            });
          }
        }
      } else if (typeof filename === 'string' && filename.trim()) {
        addEvidence({
          id: `ev-${crypto.randomUUID().slice(0, 8)}`,
          uploader: `${dispute.providerName} (Provider)`,
          uploaderRole: 'provider',
          title: filename.trim(),
          filename: filename.trim(),
          uploadedAt: nowIso,
        });
      }

      const updated = await tx.dispute.update({
        where: { id: disputeId },
        data: {
          providerStatement: statement.trim(),
          evidences,
          providerEvidence: providerEv,
        },
      });

      await tx.notification.create({
        data: {
          id: `notif-${crypto.randomUUID().slice(0, 8)}`,
          userId: dispute.arbitratorId || 'user-admin-1',
          type: 'DISPUTE',
          title: 'Provider Dispute Response',
          message: `Provider response added to ${dispute.id}.`,
          targetLink: dispute.arbitratorId ? `/arbitrator/cases/${dispute.id}` : '/admin/disputes',
        },
      });

      return { dispute: updated };
    });
  }

  async scheduleHearingTransaction(disputeId: string, values: any) {
    return this.prisma.$transaction(async (tx) => {
      const dispute = await tx.dispute.findUnique({ where: { id: disputeId } });
      if (!dispute) return { error: 'Dispute not found.' };
      if (!dispute.arbitratorId || dispute.status === 'ruled') {
        return { error: 'Assign an arbitrator before scheduling an open case.' };
      }

      const hearingSchedule = { ...values, status: 'scheduled' };
      const updated = await tx.dispute.update({
        where: { id: disputeId },
        data: {
          status: 'hearing_scheduled',
          hearingSchedule,
        },
      });

      const booking = await tx.booking.findUnique({ where: { id: dispute.bookingId } });
      if (booking) {
        const nextTimeline = Array.isArray(booking.timeline) ? [...(booking.timeline as any[])] : [];
        nextTimeline.push({
          time: new Date().toISOString(),
          title: 'Dispute Hearing Scheduled',
          desc: `Virtual hearing scheduled for ${values.scheduledDate} at ${values.scheduledTime}.`,
        });
        await tx.booking.update({ where: { id: booking.id }, data: { timeline: nextTimeline } });
      }

      await tx.notification.createMany({
        data: [
          {
            id: `notif-${crypto.randomUUID().slice(0, 8)}`,
            userId: dispute.providerId,
            type: 'HEARING',
            title: 'Dispute Hearing Scheduled',
            message: `Case ${dispute.id}: ${values.scheduledDate} at ${values.scheduledTime}. Meet link: ${values.meetUrl}`,
            targetLink: `/provider/jobs/${dispute.bookingId}`,
          },
          {
            id: `notif-${crypto.randomUUID().slice(0, 8)}`,
            userId: dispute.customerId,
            type: 'HEARING',
            title: 'Dispute Hearing Scheduled',
            message: `Case ${dispute.id}: ${values.scheduledDate} at ${values.scheduledTime}. Meet link: ${values.meetUrl}`,
            targetLink: `/customer/bookings/${dispute.bookingId}`,
          },
        ],
      });

      return { dispute: updated };
    });
  }

  async issueRulingTransaction(disputeId: string, values: any) {
    return this.prisma.$transaction(async (tx) => {
      const dispute = await tx.dispute.findUnique({ where: { id: disputeId } });
      if (!dispute) return { error: 'Dispute not found.' };
      if (!dispute.arbitratorId || dispute.status === 'ruled') {
        return { error: 'Only an assigned, open case can receive a ruling.' };
      }

      const booking = await tx.booking.findUnique({
        where: { id: dispute.bookingId },
        include: { paymentLedger: true },
      });
      if (!booking) {
        return { error: 'Associated booking no longer exists.' };
      }

      const awardAmount = Math.round(Number(values.awardAmount));
      const isFavorProvider = String(values.verdict).toLowerCase().includes('provider');
      const remainingRefundableInr = booking.paymentLedger
        ? Math.max(0, Number(booking.paymentLedger.grossAmountInr) - Number(booking.paymentLedger.refundedAmountInr || 0))
        : Number(booking.amountInr);

      if (isFavorProvider && awardAmount > 0) {
        return { error: 'Rulings in favour of Provider cannot include a customer refund award.' };
      }
      if (!isFavorProvider && awardAmount > remainingRefundableInr) {
        return {
          error: `Award amount (₹${awardAmount}) exceeds the maximum escrow refund cap of ₹${remainingRefundableInr} for booking #${booking.id}.`,
        };
      }

      const ruling = { ...values, awardAmount, issuedAt: new Date().toISOString() };
      const refundPercentage =
        booking.amountInr > 0 ? Math.min(100, Math.round((awardAmount / booking.amountInr) * 100)) : 0;

      const updatedDispute = await tx.dispute.update({
        where: { id: disputeId },
        data: {
          status: 'ruled',
          ruling,
          rulingDecision: values.verdict,
          refundPercentage,
        },
      });

      let nextBookingStatus = booking.statusBeforeDispute || 'completed';
      const wasCompletedBeforeDispute =
        booking.statusBeforeDispute === 'completed' ||
        (!booking.statusBeforeDispute &&
          Array.isArray(booking.timeline) &&
          (booking.timeline as any[]).some((e: any) => /work completed|job completed/i.test(`${e?.title || ''} ${e?.desc || ''}`)));

      if (!isFavorProvider && awardAmount > 0) {
        if (booking.paymentLedger) {
          if (wasCompletedBeforeDispute) {
            const refundedAmountInr = Math.min(
              Number(booking.paymentLedger.grossAmountInr),
              Number(booking.paymentLedger.refundedAmountInr || 0) + awardAmount,
            );
            const paymentStatus =
              refundedAmountInr >= Number(booking.paymentLedger.grossAmountInr)
                ? 'Refunded'
                : 'Partially Refunded';
            await tx.paymentLedger.update({
              where: { id: booking.paymentLedger.id },
              data: { refundedAmountInr, paymentStatus },
            });
            nextBookingStatus = 'completed';
          } else {
            const refundUpdate = calculateRefundLedgerUpdate(
              booking.paymentLedger.grossAmountInr,
              booking.paymentLedger.refundedAmountInr,
              booking.paymentLedger.paymentStatus,
              awardAmount,
            );
            if (refundUpdate) {
              await tx.paymentLedger.update({ where: { id: booking.paymentLedger.id }, data: refundUpdate });
              if (refundUpdate.paymentStatus === 'Refunded') nextBookingStatus = 'cancelled';
            }
          }
        }

        await tx.account.update({
          where: { id: dispute.customerId },
          data: { walletBalanceInr: { increment: awardAmount } },
        });
        await tx.walletTransaction.create({
          data: {
            id: `wtxn-${crypto.randomUUID().slice(0, 8)}`,
            accountId: dispute.customerId,
            bookingId: booking.id,
            disputeId: dispute.id,
            type: 'DISPUTE_AWARD',
            direction: 'CREDIT',
            amountInr: awardAmount,
            grossAmountInr: booking.amountInr,
            platformFeeInr: 0,
            netAmountInr: awardAmount,
            status: 'Refunded',
            description: wasCompletedBeforeDispute
              ? `Arbitration award credited to wallet (recovered from provider) for Case #${dispute.id}`
              : `Arbitration award credited to wallet (from escrow) for Case #${dispute.id}`,
          },
        });

        // Deduct from Provider ONLY if the job had already reached Completed (payout already credited to provider)
        if (wasCompletedBeforeDispute) {
          await tx.account.update({
            where: { id: dispute.providerId },
            data: { walletBalanceInr: { decrement: awardAmount } },
          });
          await tx.walletTransaction.create({
            data: {
              id: `wtxn-${crypto.randomUUID().slice(0, 8)}`,
              accountId: dispute.providerId,
              bookingId: booking.id,
              disputeId: dispute.id,
              type: 'DISPUTE_DEDUCTION',
              direction: 'DEBIT',
              amountInr: awardAmount,
              grossAmountInr: booking.amountInr,
              platformFeeInr: 0,
              netAmountInr: awardAmount,
              status: 'Successful',
              description: `Arbitration award deducted from wallet for completed booking #${booking.id} (Case #${dispute.id})`,
            },
          });
        }
      }

      const arbitratorFee = 250;
      if (dispute.arbitratorId) {
        if (booking.paymentLedger) {
          await tx.paymentLedger.update({
            where: { id: booking.paymentLedger.id },
            data: { arbitratorFeeInr: arbitratorFee },
          });
        }
        await tx.account.update({
          where: { id: dispute.arbitratorId },
          data: { walletBalanceInr: { increment: arbitratorFee } },
        });
        await tx.walletTransaction.create({
          data: {
            id: `wtxn-${crypto.randomUUID().slice(0, 8)}`,
            accountId: dispute.arbitratorId,
            bookingId: booking.id,
            disputeId: dispute.id,
            type: 'ARBITRATOR_FEE',
            direction: 'CREDIT',
            amountInr: arbitratorFee,
            grossAmountInr: booking.amountInr,
            platformFeeInr: 0,
            netAmountInr: arbitratorFee,
            status: 'Successful',
            description: `Arbitration adjudication fee for Case #${dispute.id}`,
          },
        });
      }

      const nextTimeline = Array.isArray(booking.timeline) ? [...(booking.timeline as any[])] : [];
      nextTimeline.push({
        time: new Date().toISOString(),
        title: 'Dispute Resolved',
        desc: `${values.verdict}. Award: ₹${awardAmount}. ${values.reason.trim()}`,
      });

      await tx.booking.update({
        where: { id: booking.id },
        data: {
          hasDispute: false,
          status: nextBookingStatus,
          timeline: nextTimeline,
        },
      });

      await tx.notification.createMany({
        data: [
          {
            id: `notif-${crypto.randomUUID().slice(0, 8)}`,
            userId: dispute.providerId,
            type: 'RULING',
            title: 'Dispute Ruling Issued',
            message: `Case ${dispute.id}: ${values.verdict}. Award: ₹${awardAmount}.`,
            targetLink: `/provider/jobs/${dispute.bookingId}`,
          },
          {
            id: `notif-${crypto.randomUUID().slice(0, 8)}`,
            userId: dispute.customerId,
            type: 'RULING',
            title: 'Dispute Ruling Issued',
            message: `Case ${dispute.id}: ${values.verdict}. Award: ₹${awardAmount}.`,
            targetLink: `/customer/bookings/${dispute.bookingId}`,
          },
          {
            id: `notif-${crypto.randomUUID().slice(0, 8)}`,
            userId: 'user-admin-1',
            type: 'RULING',
            title: 'Dispute Ruling Issued',
            message: `Case ${dispute.id}: ${values.verdict}. Award: ₹${awardAmount}.`,
            targetLink: '/admin/disputes',
          },
        ],
      });

      return { dispute: updatedDispute };
    });
  }

  deleteDispute(id: string) {
    return this.prisma.dispute.delete({ where: { id } });
  }

  findAllArbitratorApplications() {
    return this.prisma.arbitratorApplication.findMany({ orderBy: { submittedAt: 'desc' } });
  }

  async createArbitratorApplication(data: any) {
    const app = await this.prisma.arbitratorApplication.create({ data });
    await this.prisma.notification.create({
      data: {
        id: `notif-${crypto.randomUUID().slice(0, 8)}`,
        userId: 'user-admin-1',
        type: 'ARBITRATOR_APP',
        title: 'New Arbitrator Application',
        message: `${app.name} applied as an Arbitrator.`,
        targetLink: '/admin/arbitrator-applications',
      },
    });
    return app;
  }

  async approveArbitratorApplicationTransaction(applicationId: string) {
    return this.prisma.$transaction(async (tx) => {
      const app = await tx.arbitratorApplication.findUnique({ where: { id: applicationId } });
      if (!app) return { error: 'Application not found.' };
      if (app.status === 'approved') return { error: 'Application is already approved.' };

      const updatedApp = await tx.arbitratorApplication.update({
        where: { id: applicationId },
        data: { status: 'approved', decidedAt: new Date() },
      });

      const email = app.email.toLowerCase();
      let account = await tx.account.findUnique({ where: { email } });
      const fallbackHash = await bcrypt.hash(DEFAULT_DEMO_PASSWORD, 10);

      if (!account) {
        account = await tx.account.create({
          data: {
            id: `user-arbit-${crypto.randomUUID().slice(0, 8)}`,
            name: app.name,
            email,
            passwordHash: app.passwordHash || fallbackHash,
            role: AccountRole.ARBITRATOR,
            phone: app.phone,
            location: app.country,
            country: app.country,
            avatar: DEFAULT_BLANK_AVATAR,
          },
        });
        await tx.arbitratorProfile.create({
          data: {
            id: `arb-prof-${account.id}`,
            accountId: account.id,
            title: app.title || 'Senior Independent Arbitrator',
            barCouncilId: app.barCouncilId,
            qualification: app.qualification,
            experienceYears: app.experienceYears,
            specialization: app.specialization,
            organization: app.organization,
          },
        });
      } else {
        account = await tx.account.update({
          where: { id: account.id },
          data: {
            role: AccountRole.ARBITRATOR,
            name: app.name,
            phone: app.phone,
            location: app.country,
            country: app.country,
          },
        });
      }

      await tx.activityLog.create({
        data: {
          id: `act-${crypto.randomUUID().slice(0, 8)}`,
          actorId: account.id,
          actorEmail: account.email,
          actorName: account.name,
          actorRole: 'arbitrator',
          action: 'ARBITRATOR_APPROVED',
          entityType: 'ARBITRATOR_APPLICATION',
          entityId: app.id,
          description: `Arbitrator application approved for ${app.name} (${app.email})`,
        },
      });

      return { application: updatedApp };
    });
  }

  rejectArbitratorApplication(applicationId: string, reason: string) {
    return this.prisma.arbitratorApplication.update({
      where: { id: applicationId },
      data: {
        status: 'rejected',
        rejectReason: reason || 'Requirements not met at this time.',
        decidedAt: new Date(),
      },
    });
  }

  deleteArbitratorApplication(id: string) {
    return this.prisma.arbitratorApplication.delete({ where: { id } });
  }
}
