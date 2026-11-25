import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class UsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAllAccounts() {
    return this.prisma.account.findMany({
      include: {
        customerProfile: { include: { addresses: true } },
        providerProfile: true,
        arbitratorProfile: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  findAccountById(id: string) {
    return this.prisma.account.findUnique({
      where: { id },
      include: {
        customerProfile: { include: { addresses: true } },
        providerProfile: true,
        arbitratorProfile: true,
      },
    });
  }

  findAllProviders() {
    return this.prisma.providerProfile.findMany({
      include: { account: true },
    });
  }

  findProviderById(id: string) {
    return this.prisma.providerProfile.findUnique({
      where: { id },
      include: { account: true },
    });
  }

  findCustomerProfileByAccountId(accountId: string) {
    return this.prisma.customerProfile.findUnique({
      where: { accountId },
      include: { addresses: true, account: true },
    });
  }

  async updateProfileTransaction(userId: string, updates: any, account: any) {
    return this.prisma.$transaction(async (tx) => {
      const accountUpdates: any = {};
      if (updates.name !== undefined && updates.name.trim()) accountUpdates.name = updates.name.trim();
      if (updates.phone !== undefined) accountUpdates.phone = updates.phone.trim();
      if (updates.avatar !== undefined) accountUpdates.avatar = updates.avatar.trim();
      if (updates.email !== undefined && updates.email.trim()) accountUpdates.email = updates.email.trim().toLowerCase();
      if (updates.location !== undefined) accountUpdates.location = updates.location.trim();
      if (updates.city !== undefined) accountUpdates.city = updates.city.trim();
      if (updates.country !== undefined) accountUpdates.country = updates.country.trim();
      if (account.role === 'ADMIN' || account.role === 'SUPER_ADMIN') {
        if (updates.department !== undefined) accountUpdates.department = updates.department.trim();
      }

      const updatedAccount = await tx.account.update({
        where: { id: userId },
        data: accountUpdates,
      });

      if (account.role === 'CUSTOMER') {
        if (Array.isArray(updates.addresses) && account.customerProfile) {
          await tx.savedAddress.deleteMany({ where: { customerId: account.customerProfile.id } });
          for (const addr of updates.addresses) {
            await tx.savedAddress.create({
              data: {
                id: addr.id || `addr-${crypto.randomUUID().slice(0, 8)}`,
                customerId: account.customerProfile.id,
                label: addr.label,
                line1: addr.addressLine || addr.line1,
                city: addr.city,
                state: addr.state || 'Karnataka',
                pinCode: addr.pincode || addr.pinCode,
                isDefault: Boolean(addr.isDefault),
              },
            });
          }
        }
        await tx.booking.updateMany({
          where: { customerId: userId },
          data: { customerName: updatedAccount.name, customerPhone: updatedAccount.phone },
        });
        await tx.dispute.updateMany({
          where: { customerId: userId },
          data: { customerName: updatedAccount.name },
        });
        await tx.supportTicket.updateMany({
          where: { creatorId: userId },
          data: { customerName: updatedAccount.name },
        });
      } else if (account.role === 'PROVIDER' && account.providerProfile) {
        const providerUpdates: any = {};
        if (updates.providerType && ['individual', 'company'].includes(updates.providerType)) {
          providerUpdates.providerType = updates.providerType;
        }
        if (updates.businessName !== undefined && updates.businessName.trim()) {
          providerUpdates.businessName = updates.businessName.trim();
        }
        if (updates.operatingCity !== undefined && updates.operatingCity.trim()) {
          providerUpdates.operatingCity = updates.operatingCity.trim();
        }
        if (updates.serviceArea !== undefined) providerUpdates.serviceArea = updates.serviceArea.trim();
        if (Array.isArray(updates.servedAreas)) providerUpdates.servedAreas = updates.servedAreas;
        if (Array.isArray(updates.servedPincodes)) providerUpdates.servedPincodes = updates.servedPincodes;
        if (updates.coverageRadiusKm !== undefined) {
          providerUpdates.coverageRadiusKm = Number(updates.coverageRadiusKm) || 25;
        }
        if (updates.experienceYears !== undefined) {
          providerUpdates.experienceYears = Number(updates.experienceYears) || 0;
        }
        if (updates.bio !== undefined) providerUpdates.bio = updates.bio.trim();
        if (Array.isArray(updates.skills) && updates.skills.length > 0) {
          providerUpdates.skills = [...new Set(updates.skills)];
        }
        const updatedProvider = await tx.providerProfile.update({
          where: { id: account.providerProfile.id },
          data: providerUpdates,
        });
        const activeName = updatedProvider.businessName || updatedAccount.name;
        await tx.serviceListing.updateMany({
          where: { providerId: account.providerProfile.id },
          data: { providerName: activeName },
        });
        await tx.booking.updateMany({
          where: { providerId: account.providerProfile.id },
          data: { providerName: activeName, providerPhone: updatedAccount.phone },
        });
        await tx.dispute.updateMany({
          where: { providerId: account.providerProfile.id },
          data: { providerName: activeName },
        });
        await tx.supportTicket.updateMany({
          where: { providerId: account.providerProfile.id },
          data: { providerName: activeName },
        });
      } else if (account.role === 'ARBITRATOR' && account.arbitratorProfile) {
        const arbUpdates: any = {};
        if (updates.title !== undefined) arbUpdates.title = updates.title.trim();
        if (updates.specialization !== undefined) arbUpdates.specialization = updates.specialization.trim();
        if (updates.organization !== undefined) arbUpdates.organization = updates.organization.trim();
        if (Object.keys(arbUpdates).length > 0) {
          await tx.arbitratorProfile.update({
            where: { id: account.arbitratorProfile.id },
            data: arbUpdates,
          });
        }
        await tx.dispute.updateMany({
          where: { arbitratorId: userId },
          data: { arbitratorName: updatedAccount.name },
        });
      }

      await tx.activityLog.create({
        data: {
          id: `act-${crypto.randomUUID().slice(0, 8)}`,
          actorId: updatedAccount.id,
          actorEmail: updatedAccount.email,
          actorName: updatedAccount.name,
          actorRole: updatedAccount.role.toLowerCase(),
          action: 'PROFILE_UPDATE',
          entityType: 'ACCOUNT',
          entityId: updatedAccount.id,
          description: `Updated profile details for ${updatedAccount.name} (${updatedAccount.role})`,
        },
      });

      return tx.account.findUnique({
        where: { id: userId },
        include: {
          customerProfile: { include: { addresses: true } },
          providerProfile: true,
          arbitratorProfile: true,
        },
      });
    });
  }

  async replaceCustomerAddresses(customerProfileId: string, accountId: string, addresses: any[]) {
    return this.prisma.$transaction(async (tx) => {
      await tx.savedAddress.deleteMany({ where: { customerId: customerProfileId } });
      for (const addr of addresses) {
        await tx.savedAddress.create({
          data: {
            id: addr.id,
            customerId: customerProfileId,
            label: addr.label,
            line1: addr.addressLine,
            city: addr.city,
            state: addr.state || 'Karnataka',
            pinCode: addr.pincode,
            isDefault: Boolean(addr.isDefault),
          },
        });
      }
      return tx.account.findUnique({
        where: { id: accountId },
        include: {
          customerProfile: { include: { addresses: true } },
          providerProfile: true,
          arbitratorProfile: true,
        },
      });
    });
  }

  async saveProviderOnboarding(providerId: string, values: any, submit: boolean) {
    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.providerProfile.findUnique({ where: { id: providerId } });
      if (!existing) return null;

      const businessName = values.businessName.trim();
      const serviceArea = values.serviceArea.trim();
      const skills = [...new Set<string>(values.skills)];

      const accountUpdates: any = {};
      if (values.name?.trim()) accountUpdates.name = values.name.trim();
      if (values.phone !== undefined) accountUpdates.phone = values.phone.trim();
      if (values.avatar !== undefined) accountUpdates.avatar = values.avatar.trim();
      if (Object.keys(accountUpdates).length > 0) {
        await tx.account.update({ where: { id: existing.accountId }, data: accountUpdates });
      }

      const updated = await tx.providerProfile.update({
        where: { id: providerId },
        data: {
          providerType: values.providerType || existing.providerType,
          businessName,
          bio: values.bio !== undefined ? values.bio.trim() : existing.bio,
          experienceYears: values.experienceYears !== undefined ? Number(values.experienceYears) || 0 : existing.experienceYears,
          operatingCity: values.operatingCity?.trim() || existing.operatingCity,
          serviceArea,
          servedAreas: Array.isArray(values.servedAreas)
            ? values.servedAreas
            : serviceArea.split(',').map((s: string) => s.trim()).filter(Boolean),
          servedPincodes: Array.isArray(values.servedPincodes)
            ? values.servedPincodes
            : typeof values.servedPincodes === 'string'
              ? values.servedPincodes.split(',').map((s: string) => s.trim()).filter(Boolean)
              : existing.servedPincodes,
          coverageRadiusKm: values.coverageRadiusKm !== undefined ? Number(values.coverageRadiusKm) || 25 : existing.coverageRadiusKm,
          skills,
          documentName: values.documentName?.trim() || '',
          verificationStatus: submit ? 'submitted' : existing.verificationStatus,
          verificationFeedback: submit ? 'Submitted for Admin review.' : existing.verificationFeedback,
        },
        include: { account: true },
      });

      await tx.serviceListing.updateMany({ where: { providerId }, data: { providerName: businessName } });
      await tx.booking.updateMany({ where: { providerId }, data: { providerName: businessName } });
      await tx.dispute.updateMany({ where: { providerId }, data: { providerName: businessName } });
      await tx.supportTicket.updateMany({ where: { providerId }, data: { providerName: businessName } });

      if (submit) {
        await tx.notification.create({
          data: {
            id: `notif-${crypto.randomUUID().slice(0, 8)}`,
            userId: 'user-admin-1',
            type: 'VERIFICATION',
            title: 'Provider Verification Submitted',
            message: `${businessName} submitted a verification profile.`,
            targetLink: '/admin/providers',
          },
        });
      }

      return updated;
    });
  }

  async moderateProvider(providerId: string, status: string, reason: string) {
    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.providerProfile.update({
        where: { id: providerId },
        data: {
          verificationStatus: status,
          verificationFeedback: reason.trim(),
        },
        include: { account: true },
      });

      await tx.notification.create({
        data: {
          id: `notif-${crypto.randomUUID().slice(0, 8)}`,
          userId: updated.accountId,
          type: 'VERIFICATION',
          title: 'Verification Updated',
          message: `${status.replaceAll('_', ' ')}: ${reason.trim()}`,
          targetLink: '/provider/profile',
        },
      });

      return updated;
    });
  }

  updateAvailability(providerId: string, schedule: any) {
    return this.prisma.providerProfile.update({
      where: { id: providerId },
      data: {
        weeklyAvailability: schedule,
        blackoutDates: schedule.blackoutDates || [],
        leadTimeMinutes: schedule.leadMinutes ?? 0,
        bufferMinutes: schedule.bufferMinutes ?? 0,
      },
      include: { account: true },
    });
  }

  deleteAccount(userId: string) {
    return this.prisma.account.delete({ where: { id: userId } });
  }
}
