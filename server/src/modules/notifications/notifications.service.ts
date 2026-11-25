import { Injectable } from '@nestjs/common';
import { NotificationsRepository } from './notifications.repository';
import { serializeNotification } from '../../common/utils/serializers';

@Injectable()
export class NotificationsService {
  constructor(private readonly notifRepo: NotificationsRepository) {}

  async getNotifications(userId: string) {
    const list = await this.notifRepo.findByUser(userId);
    return list.map(serializeNotification);
  }

  async createNotification(body: any, actorId: string) {
    const created = await this.notifRepo.createNotification({
      id: `notif-${crypto.randomUUID().slice(0, 8)}`,
      userId: body.userId || actorId,
      type: body.type || 'ALERT',
      title: body.title,
      message: body.message,
      targetLink: body.targetLink || '/',
    });
    return serializeNotification(created);
  }

  async markRead(userId: string, notificationId?: string) {
    const list = await this.notifRepo.markRead(userId, notificationId);
    return list.map(serializeNotification);
  }

  async deleteOne(id: string) {
    await this.notifRepo.deleteOne(id);
    return { success: true, id };
  }

  async clearForUser(userId: string) {
    await this.notifRepo.deleteAllForUser(userId);
    return { success: true };
  }
}
