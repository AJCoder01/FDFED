import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { seedDatabase } from '../../../prisma/seed-data';

@Injectable()
export class PlatformRepository {
  constructor(private readonly prisma: PrismaService) {}

  findActivityLogs(userId?: string) {
    return this.prisma.activityLog.findMany({
      where: userId ? { actorId: userId } : undefined,
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
  }

  createActivityLog(data: {
    id: string;
    actorId: string;
    actorEmail: string;
    actorName: string;
    actorRole: string;
    action: string;
    entityType?: string;
    entityId?: string;
    description: string;
    metadata?: any;
  }) {
    return this.prisma.activityLog.create({ data });
  }

  updateActivityLog(id: string, data: any) {
    return this.prisma.activityLog.update({ where: { id }, data });
  }

  deleteActivityLog(id: string) {
    return this.prisma.activityLog.delete({ where: { id } });
  }

  async getPlatformCounts() {
    const [accounts, providersPending, services, bookings, openTickets, pendingDisputes] = await Promise.all([
      this.prisma.account.count(),
      this.prisma.providerProfile.count({ where: { verificationStatus: 'submitted' } }),
      this.prisma.serviceListing.count(),
      this.prisma.booking.count(),
      this.prisma.supportTicket.count({ where: { status: { not: 'resolved' } } }),
      this.prisma.dispute.count({ where: { status: 'pending_assignment' } }),
    ]);
    return { accounts, providersPending, services, bookings, openTickets, pendingDisputes };
  }

  async resetDemoDatabase() {
    await seedDatabase(this.prisma);
    return { success: true, message: 'Demo data reset.' };
  }
}
