import { Injectable } from '@nestjs/common';
import { AccountRole } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { DEFAULT_SCHEDULE } from '../../../prisma/seed-data';

@Injectable()
export class AuthRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAccountByEmail(email: string) {
    return this.prisma.account.findUnique({
      where: { email: email.trim().toLowerCase() },
      include: {
        customerProfile: { include: { addresses: true } },
        providerProfile: true,
        arbitratorProfile: true,
      },
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

  async createAccountWithProfile(data: {
    id: string;
    name: string;
    email: string;
    passwordHash: string;
    role: AccountRole;
    isSuperUser: boolean;
    phone: string;
    location: string;
    city?: string;
    country?: string;
    avatar: string;
    department?: string;
    address?: { id: string; label: string; line1: string; city: string; pinCode: string };
    provider?: {
      providerType?: string;
      businessName: string;
      bio?: string;
      experienceYears?: number;
      operatingCity?: string;
      serviceArea: string;
      servedAreas?: string[];
      servedPincodes?: string[];
      coverageRadiusKm?: number;
      skills: string[];
    };
    arbitrator?: { title: string; country?: string };
  }) {
    return this.prisma.$transaction(async (tx) => {
      await tx.account.create({
        data: {
          id: data.id,
          name: data.name,
          email: data.email,
          passwordHash: data.passwordHash,
          role: data.role,
          isSuperUser: data.isSuperUser,
          phone: data.phone,
          location: data.location,
          city: data.city || data.location,
          country: data.country || 'India',
          avatar: data.avatar,
          department: data.department,
          walletBalanceInr: data.role === AccountRole.CUSTOMER ? 5000 : 0,
        },
      });

      if (data.role === AccountRole.CUSTOMER && data.address) {
        await tx.customerProfile.create({
          data: {
            id: `cust-prof-${data.id}`,
            accountId: data.id,
            addresses: {
              create: {
                id: data.address.id,
                label: data.address.label,
                line1: data.address.line1,
                city: data.address.city,
                state: 'Karnataka',
                pinCode: data.address.pinCode,
                isDefault: true,
              },
            },
          },
        });
      } else if (data.role === AccountRole.PROVIDER && data.provider) {
        await tx.providerProfile.create({
          data: {
            id: data.id,
            accountId: data.id,
            providerType: data.provider.providerType || 'company',
            businessName: data.provider.businessName,
            bio: data.provider.bio || '',
            experienceYears: data.provider.experienceYears || 0,
            operatingCity: data.provider.operatingCity || data.location || 'Bengaluru',
            serviceArea: data.provider.serviceArea,
            servedAreas: data.provider.servedAreas || [data.provider.operatingCity || data.location || 'Bengaluru'],
            servedPincodes: data.provider.servedPincodes || [],
            coverageRadiusKm: data.provider.coverageRadiusKm ?? 25,
            skills: data.provider.skills,
            verificationStatus: 'approved',
            ratingAvg: 5.0,
            reviewCount: 0,
            weeklyAvailability: DEFAULT_SCHEDULE,
            blackoutDates: [],
          },
        });
      } else if (data.role === AccountRole.ARBITRATOR && data.arbitrator) {
        await tx.arbitratorProfile.create({
          data: {
            id: `arb-prof-${data.id}`,
            accountId: data.id,
            title: data.arbitrator.title,
          },
        });
      }

      return tx.account.findUnique({
        where: { id: data.id },
        include: {
          customerProfile: { include: { addresses: true } },
          providerProfile: true,
          arbitratorProfile: true,
        },
      });
    });
  }

  logActivity(entry: {
    actorId: string;
    actorEmail: string;
    actorName: string;
    actorRole: string;
    action: string;
    description: string;
  }) {
    return this.prisma.activityLog.create({
      data: {
        id: `act-${crypto.randomUUID().slice(0, 8)}`,
        actorId: entry.actorId,
        actorEmail: entry.actorEmail,
        actorName: entry.actorName,
        actorRole: entry.actorRole,
        action: entry.action,
        entityType: 'ACCOUNT',
        entityId: entry.actorId,
        description: entry.description,
      },
    });
  }
}
