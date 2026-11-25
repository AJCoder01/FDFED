import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { GovernanceRepository } from './governance.repository';
import { serializeArbitratorApplication, serializeDispute, serializeTicket } from '../../common/utils/serializers';
import { localClock, slotMinutes, validDate } from '../bookings/scheduling.util';
import { DEFAULT_DEMO_PASSWORD } from '../../../prisma/seed-data';

@Injectable()
export class GovernanceService {
  constructor(private readonly govRepo: GovernanceRepository) {}

  async getTickets(role?: string, userId?: string) {
    const tickets = await this.govRepo.findAllTickets(role, userId);
    return tickets.map(serializeTicket);
  }

  async createTicket(values: any, actor: any) {
    if (!values.description?.trim()) throw new BadRequestException('Describe the service issue.');
    const result = await this.govRepo.createTicketTransaction(values, values.customerId || actor.id);
    if ('error' in result) throw new BadRequestException(result.error);
    return serializeTicket(result.ticket);
  }

  async resolveTicket(ticketId: string, outcome: string, notes?: string) {
    const supported = [
      'Full Mock Refund Issued',
      'Partial Refund (50%)',
      'Redo Service Requested',
      'Formal Warning Issued to Provider',
      'Escalated to Arbitration',
    ];
    if (!supported.includes(outcome)) throw new BadRequestException('Choose a supported resolution.');
    const result = await this.govRepo.resolveTicketTransaction(ticketId, outcome, notes);
    if ('error' in result) throw new BadRequestException(result.error);
    return serializeTicket(result.ticket);
  }

  async deleteTicket(id: string) {
    await this.govRepo.deleteTicket(id);
    return { success: true, id };
  }

  async getDisputes() {
    const disputes = await this.govRepo.findAllDisputes();
    return disputes.map(serializeDispute);
  }

  async getDisputeById(id: string) {
    const dispute = await this.govRepo.findDisputeById(id);
    if (!dispute) throw new NotFoundException('Dispute not found.');
    return serializeDispute(dispute);
  }

  async createDispute(values: any, actor: any) {
    const claim = Number(values.claimAmount);
    if (!values.customerStatement?.trim() || !Number.isFinite(claim) || claim <= 0) {
      throw new BadRequestException('Enter a statement and a valid positive claim amount.');
    }
    const result = await this.govRepo.createDisputeTransaction(values, values.customerId || actor.id);
    if ('error' in result) throw new BadRequestException(result.error);
    return serializeDispute(result.dispute);
  }

  async assignDispute(disputeId: string, arbitrator: { id: string; name: string }) {
    if (!arbitrator?.id || !arbitrator?.name) throw new BadRequestException('Select a valid arbitrator.');
    const result = await this.govRepo.assignDisputeTransaction(disputeId, arbitrator);
    if ('error' in result) throw new BadRequestException(result.error);
    return serializeDispute(result.dispute);
  }

  async saveDisputeResponse(disputeId: string, body: any, actor: any) {
    const result = await this.govRepo.saveDisputeResponseTransaction(
      disputeId,
      body.providerId || actor.id,
      body.statement || '',
      body.filename ?? body.evidences ?? '',
    );
    if ('error' in result) throw new BadRequestException(result.error);
    return serializeDispute(result.dispute);
  }

  async scheduleHearing(disputeId: string, values: any) {
    if (!validDate(values.scheduledDate) || values.scheduledDate < localClock().date) {
      throw new BadRequestException('Choose today or a future hearing date.');
    }
    if (
      !Number.isFinite(slotMinutes(values.scheduledTime)) ||
      (values.scheduledDate === localClock().date && slotMinutes(values.scheduledTime) <= localClock().minutes)
    ) {
      throw new BadRequestException('Choose a valid future hearing time.');
    }
    if (!/^https?:\/\//i.test(values.meetUrl || '')) {
      throw new BadRequestException('Enter an HTTP or HTTPS meeting URL.');
    }
    const result = await this.govRepo.scheduleHearingTransaction(disputeId, values);
    if ('error' in result) throw new BadRequestException(result.error);
    return serializeDispute(result.dispute);
  }

  async issueRuling(disputeId: string, values: any) {
    const validVerdicts = [
      'In Favor of Customer',
      'In favour of Customer',
      'In Favor of Provider',
      'In favour of Provider',
      'Mutual Settlement / Split',
    ];
    const awardAmount = Number(values.awardAmount);
    if (
      !validVerdicts.includes(values.verdict) ||
      !values.reason?.trim() ||
      values.reason.trim().length < 10 ||
      !Number.isFinite(awardAmount) ||
      awardAmount < 0
    ) {
      throw new BadRequestException('Enter a valid verdict, non-negative award, and rationale (at least 10 characters).');
    }
    const isFavorProvider = String(values.verdict).toLowerCase().includes('provider');
    if (isFavorProvider && awardAmount > 0) {
      throw new BadRequestException('Rulings in favour of Provider must have an award amount of ₹0.');
    }
    const result = await this.govRepo.issueRulingTransaction(disputeId, values);
    if ('error' in result) throw new BadRequestException(result.error);
    return serializeDispute(result.dispute);
  }

  async deleteDispute(id: string) {
    await this.govRepo.deleteDispute(id);
    return { success: true, id };
  }

  async getArbitratorApplications() {
    const apps = await this.govRepo.findAllArbitratorApplications();
    return apps.map(serializeArbitratorApplication);
  }

  async submitArbitratorApplication(values: any) {
    const password = values.password;
    if (password && password.length < 8) {
      throw new BadRequestException('Password must be at least 8 characters long.');
    }
    const cleanPhone = (values.phone || '').trim();
    const phoneMatch = cleanPhone.replace(/[\s\-()]/g, '').match(/^(\+91|\+\d{1,4})(\d+)$/);
    if (cleanPhone && (!phoneMatch || phoneMatch[2].length !== 10)) {
      throw new BadRequestException('Please enter a valid 10-digit phone number.');
    }
    if (cleanPhone && phoneMatch && phoneMatch[2].startsWith('0')) {
      throw new BadRequestException('Phone number cannot start with 0. Please enter a valid 10-digit phone number.');
    }
    const formattedPhone = phoneMatch ? `${phoneMatch[1]} ${phoneMatch[2]}` : cleanPhone;
    const passwordHash = await bcrypt.hash(password || DEFAULT_DEMO_PASSWORD, 10);

    const created = await this.govRepo.createArbitratorApplication({
      id: `arb-app-${crypto.randomUUID().slice(0, 8)}`,
      name: values.name.trim(),
      email: values.email.trim().toLowerCase(),
      phone: formattedPhone,
      country: (values.country || 'India').trim(),
      linkedin: values.linkedin?.trim() || '',
      title: values.title?.trim() || 'Panel Arbitrator',
      passwordHash,
      barCouncilId: values.barCouncilId?.trim() || null,
      qualification: values.qualification?.trim() || null,
      experienceYears: Number(values.experience) || 0,
      specialization: (values.expertise || values.specialization || 'Consumer Disputes').trim(),
      organization: (values.organization || 'Independent Panel').trim(),
      prevExperience: values.prevExperience?.trim() || '',
      files: values.files || {
        resume: values.fileName_resume || values.resume || '',
        cert: values.fileName_cert || values.cert || '',
        license: values.fileName_license || values.license || '',
        extra: values.fileName_extra || values.extra || '',
      },
      status: 'pending',
    });

    return serializeArbitratorApplication(created);
  }

  async approveArbitratorApplication(id: string) {
    const result = await this.govRepo.approveArbitratorApplicationTransaction(id);
    if ('error' in result) throw new BadRequestException(result.error);
    return serializeArbitratorApplication(result.application);
  }

  async rejectArbitratorApplication(id: string, reason = '') {
    const updated = await this.govRepo.rejectArbitratorApplication(id, reason);
    return serializeArbitratorApplication(updated);
  }

  async deleteArbitratorApplication(id: string) {
    await this.govRepo.deleteArbitratorApplication(id);
    return { success: true, id };
  }
}
