import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class NotificationsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByUser(userId: string) {
    return this.prisma.notification.findMany({
      where: { OR: [{ userId }, { userId: null }] },
      orderBy: { createdAt: 'desc' },
    });
  }

  createNotification(data: {
    id: string;
    userId?: string;
    type?: string;
    title: string;
    message: string;
    targetLink?: string;
  }) {
    return this.prisma.notification.create({ data });
  }

  async markRead(userId: string, notificationId?: string) {
    await this.prisma.notification.updateMany({
      where: {
        OR: [{ userId }, { userId: null }],
        ...(notificationId ? { id: notificationId } : {}),
      },
      data: { isRead: true },
    });
    return this.findByUser(userId);
  }

  deleteOne(id: string) {
    return this.prisma.notification.delete({ where: { id } });
  }

  deleteAllForUser(userId: string) {
    return this.prisma.notification.deleteMany({ where: { userId } });
  }
}
