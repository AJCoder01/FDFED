import { BadRequestException, ConflictException, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AccountRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { AuthRepository } from './auth.repository';
import { serializeAccount, toUiRole } from '../../common/utils/serializers';
import { DEFAULT_BLANK_AVATAR, DEFAULT_DEMO_PASSWORD } from '../../../prisma/seed-data';

const DEMO_TARGET_EMAILS: Record<string, string> = {
  customer: 'aarav@gmail.com',
  provider: 'rohan@gmail.com',
  admin: 'staffadmin@gmail.com',
  staffAdmin: 'staffadmin@gmail.com',
  superuser: 'admin@gmail.com',
  arbitrator: 'kabir@gmail.com',
};

@Injectable()
export class AuthService {
  constructor(
    private readonly authRepo: AuthRepository,
    private readonly jwtService: JwtService,
  ) {}

  private signToken(account: any) {
    const uiRole = toUiRole(account.role);
    const isSuperUser =
      Boolean(account.isSuperUser) ||
      String(account.role).toUpperCase() === 'SUPER_ADMIN' ||
      account.id === 'user-admin-1';

    return this.jwtService.sign({
      sub: account.id,
      email: account.email,
      role: uiRole,
      isSuperUser,
    });
  }

  async login(email: string, password: string, expectedRole?: string) {
    const normalizedEmail = email?.trim().toLowerCase();
    if (!normalizedEmail || !password) {
      throw new BadRequestException('Please enter both email and password.');
    }

    const account = await this.authRepo.findAccountByEmail(normalizedEmail);
    if (!account) {
      throw new UnauthorizedException('No account found with this email. Please check your credentials or sign up.');
    }

    const isDemoAccount = Object.values(DEMO_TARGET_EMAILS).includes(normalizedEmail);
    const demoFallbackPasswords = [DEFAULT_DEMO_PASSWORD, '123456Ab@', 'password123', '12345678', 'password', 'admin123'];
    const passwordMatches =
      (await bcrypt.compare(password, account.passwordHash)) ||
      (isDemoAccount && demoFallbackPasswords.includes(password));

    if (!passwordMatches) {
      throw new UnauthorizedException('Incorrect password. Please verify your credentials.');
    }

    const uiRole = toUiRole(account.role);
    if (expectedRole && uiRole !== expectedRole.toLowerCase()) {
      throw new ForbiddenException(
        `This account is registered as a ${uiRole.toUpperCase()}, not ${expectedRole.toUpperCase()}. Please sign in under the correct role.`,
      );
    }

    const user = serializeAccount(account);
    await this.authRepo.logActivity({
      actorId: user.id,
      actorEmail: user.email,
      actorName: user.name,
      actorRole: user.role,
      action: 'LOGIN',
      description: `User signed in: ${user.name} (${user.role.toUpperCase()})`,
    });

    return {
      accessToken: this.signToken(account),
      user,
    };
  }

  async signup(data: any) {
    const email = data.email?.trim().toLowerCase();
    const password = data.password;
    const roleRaw = data.role?.trim().toLowerCase();
    const name = data.name?.trim();
    const phone = data.phone?.trim();

    if (!name) throw new BadRequestException('Please enter your full name.');
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new BadRequestException('Please enter a valid email address.');
    }
    if (!password || password.length < 8) {
      throw new BadRequestException('Password must be at least 8 characters long.');
    }
    if (!phone) throw new BadRequestException('Please enter your contact phone number.');
    const phoneMatch = phone.replace(/[\s\-()]/g, '').match(/^(\+91|\+\d{1,4})(\d+)$/);
    if (!phoneMatch || phoneMatch[2].length !== 10) {
      throw new BadRequestException('Please enter a valid 10-digit phone number.');
    }
    if (phoneMatch[2].startsWith('0')) {
      throw new BadRequestException('Phone number cannot start with 0. Please enter a valid 10-digit phone number.');
    }
    const formattedPhone = `${phoneMatch[1]} ${phoneMatch[2]}`;

    if (!['customer', 'provider', 'admin', 'arbitrator'].includes(roleRaw)) {
      throw new BadRequestException('Please choose a valid role (Customer, Provider, Admin, or Arbitrator).');
    }

    const existing = await this.authRepo.findAccountByEmail(email);
    if (existing) {
      throw new ConflictException('An account with this email address already exists. Please log in.');
    }

    const roleMap: Record<string, AccountRole> = {
      customer: AccountRole.CUSTOMER,
      provider: AccountRole.PROVIDER,
      admin: AccountRole.ADMIN,
      arbitrator: AccountRole.ARBITRATOR,
    };

    const userId = `user-${roleRaw.slice(0, 4)}-${crypto.randomUUID().slice(0, 8)}`;
    const enteredLocation = (data.location || data.city || data.serviceArea || data.country || '').trim();
    const passwordHash = await bcrypt.hash(password, 10);

    const created = await this.authRepo.createAccountWithProfile({
      id: userId,
      name,
      email,
      passwordHash,
      role: roleMap[roleRaw],
      isSuperUser: false,
      phone: formattedPhone,
      location: enteredLocation || 'Bengaluru',
      city: data.city?.trim() || enteredLocation || 'Bengaluru',
      country: data.country?.trim() || 'India',
      avatar: data.avatar?.trim() || DEFAULT_BLANK_AVATAR,
      department: roleRaw === 'admin' ? data.department?.trim() || 'Platform Administration' : undefined,
      address:
        roleRaw === 'customer'
          ? {
              id: `addr-${crypto.randomUUID().slice(0, 8)}`,
              label: data.addressLabel?.trim() || 'Home',
              line1: data.addressLine?.trim() || 'Flat 101, Main Road',
              city: data.city?.trim() || enteredLocation || 'Bengaluru',
              pinCode: data.pincode?.trim() || '560001',
            }
          : undefined,
      provider:
        roleRaw === 'provider'
          ? {
              providerType: data.providerType === 'individual' ? 'individual' : 'company',
              businessName:
                data.providerType === 'individual'
                  ? data.businessName?.trim() || `${name} (Independent Freelancer)`
                  : data.businessName?.trim() || `${name}'s Pro Services`,
              bio: data.bio?.trim() || '',
              experienceYears: Number(data.experienceYears || 0),
              operatingCity: data.operatingCity?.trim() || data.city?.trim() || enteredLocation || 'Bengaluru',
              serviceArea: data.serviceArea?.trim() || data.operatingCity?.trim() || enteredLocation || 'Bengaluru',
              servedAreas: Array.isArray(data.servedAreas)
                ? data.servedAreas
                : String(data.serviceArea || data.operatingCity || enteredLocation || 'Bengaluru')
                    .split(',')
                    .map((s) => s.trim())
                    .filter(Boolean),
              servedPincodes: Array.isArray(data.servedPincodes)
                ? data.servedPincodes
                : String(data.servedPincodes || '')
                    .split(',')
                    .map((s) => s.trim())
                    .filter(Boolean),
              coverageRadiusKm: Number(data.coverageRadiusKm || 25),
              skills:
                Array.isArray(data.skills) && data.skills.length > 0
                  ? data.skills
                  : [data.skill?.trim() || 'Home Cleaning'],
            }
          : undefined,
      arbitrator:
        roleRaw === 'arbitrator'
          ? {
              title: data.title?.trim() || 'Senior Independent Arbitrator',
              country: data.country?.trim() || enteredLocation || 'India',
            }
          : undefined,
    });

    const user = serializeAccount(created);
    await this.authRepo.logActivity({
      actorId: user.id,
      actorEmail: user.email,
      actorName: user.name,
      actorRole: user.role,
      action: 'SIGNUP',
      description: `New ${roleRaw.toUpperCase()} registered: ${user.name} (${user.email})`,
    });

    return {
      accessToken: this.signToken(created),
      user,
    };
  }

  async getMe(userId: string) {
    const account = await this.authRepo.findAccountById(userId);
    if (!account) throw new UnauthorizedException('Session account not found.');
    return serializeAccount(account);
  }

  async logout(user: any) {
    if (user) {
      await this.authRepo.logActivity({
        actorId: user.id,
        actorEmail: user.email,
        actorName: user.name || user.email,
        actorRole: user.role,
        action: 'LOGOUT',
        description: `User signed out: ${user.name || user.email} (${String(user.role).toUpperCase()})`,
      });
    }
    return { success: true };
  }

  async demoSwitch(targetRole: string, currentActor?: any) {
    if (process.env.ENABLE_DEMO_SWITCHER !== 'true') {
      throw new ForbiddenException('Demo switcher is disabled.');
    }

    if (targetRole === 'guest') {
      if (currentActor) {
        await this.authRepo.logActivity({
          actorId: currentActor.id,
          actorEmail: currentActor.email,
          actorName: currentActor.name || currentActor.email,
          actorRole: currentActor.role,
          action: 'ROLE_SWITCH',
          description: 'Switched demo persona to: Guest (Public Visitor)',
        });
      }
      return { accessToken: null, user: null, role: 'guest' };
    }

    const targetEmail = DEMO_TARGET_EMAILS[targetRole];
    if (!targetEmail) throw new BadRequestException(`Unknown demo role: ${targetRole}`);

    const account = await this.authRepo.findAccountByEmail(targetEmail);
    if (!account) throw new UnauthorizedException('Demo account missing. Run demo reset to re-seed.');

    const user = serializeAccount(account);
    await this.authRepo.logActivity({
      actorId: user.id,
      actorEmail: user.email,
      actorName: user.name,
      actorRole: user.role,
      action: 'ROLE_SWITCH',
      description: `Switched demo persona to: ${user.name} (${user.role.toUpperCase()})`,
    });

    return {
      accessToken: this.signToken(account),
      user,
      role: user.role,
    };
  }
}
