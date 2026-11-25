import { ForbiddenException, Injectable } from '@nestjs/common';
import { PlatformRepository } from './platform.repository';
import { serializeActivityLog } from '../../common/utils/serializers';

@Injectable()
export class PlatformService {
  constructor(private readonly platformRepo: PlatformRepository) {}

  async getActivityLogs(userId?: string) {
    const logs = await this.platformRepo.findActivityLogs(userId);
    return logs.map(serializeActivityLog);
  }

  async createActivityLog(body: any, actor?: any) {
    const created = await this.platformRepo.createActivityLog({
      id: `act-${crypto.randomUUID().slice(0, 8)}`,
      actorId: body.userId || actor?.id || 'anonymous',
      actorEmail: body.userEmail || actor?.email || 'anonymous@servicehub.in',
      actorName: body.userName || actor?.name || 'User',
      actorRole: body.role || actor?.role || 'guest',
      action: body.type || body.action || 'GENERAL',
      entityType: body.entityType || 'SYSTEM',
      entityId: body.entityId || '',
      description: body.description || '',
      metadata: body.metadata || {},
    });
    return serializeActivityLog(created);
  }

  async updateActivityLog(id: string, body: any) {
    const updated = await this.platformRepo.updateActivityLog(id, {
      description: body.description,
      metadata: body.metadata,
    });
    return serializeActivityLog(updated);
  }

  async deleteActivityLog(id: string) {
    await this.platformRepo.deleteActivityLog(id);
    return { success: true, id };
  }

  getStats() {
    return this.platformRepo.getPlatformCounts();
  }

  resetDemo() {
    if (process.env.ENABLE_DEMO_SWITCHER !== 'true') {
      throw new ForbiddenException('Demo reset is disabled.');
    }
    return this.platformRepo.resetDemoDatabase();
  }
}
