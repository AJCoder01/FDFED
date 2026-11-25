import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { UsersRepository } from './users.repository';
import { serializeAccount, serializeProvider } from '../../common/utils/serializers';
import { DEFAULT_SCHEDULE, validateSchedule } from '../bookings/scheduling.util';

@Injectable()
export class UsersService {
  constructor(private readonly usersRepo: UsersRepository) {}

  async getAccounts() {
    const accounts = await this.usersRepo.findAllAccounts();
    return accounts.map(serializeAccount);
  }

  async getUserProfile(userId: string) {
    const account = await this.usersRepo.findAccountById(userId);
    if (!account) throw new NotFoundException('Account not found.');
    return serializeAccount(account);
  }

  async getProviders() {
    const providers = await this.usersRepo.findAllProviders();
    return providers.map(serializeProvider);
  }

  async getProviderById(providerId: string) {
    const provider = await this.usersRepo.findProviderById(providerId);
    if (!provider) throw new NotFoundException('Provider not found.');
    return serializeProvider(provider);
  }

  async getCustomerById(customerId: string) {
    const account = await this.usersRepo.findAccountById(customerId);
    if (!account || account.role !== 'CUSTOMER') {
      throw new NotFoundException('Customer not found.');
    }
    return serializeAccount(account);
  }

  async updateProfile(userId: string, updates: any, actor: any) {
    if (actor.role !== 'admin' && actor.id !== userId) {
      throw new ForbiddenException('You can only update your own profile.');
    }
    const existing = await this.usersRepo.findAccountById(userId);
    if (!existing) throw new NotFoundException('Account record not found.');
    const updated = await this.usersRepo.updateProfileTransaction(userId, updates, existing);
    return serializeAccount(updated);
  }

  async saveCustomerAddresses(customerId: string, addresses: any[], actor: any) {
    if (actor.role !== 'admin' && actor.id !== customerId) {
      throw new ForbiddenException('You can only update your own addresses.');
    }
    if (!Array.isArray(addresses)) {
      throw new BadRequestException('Provide a valid address list.');
    }
    const account = await this.usersRepo.findAccountById(customerId);
    if (!account?.customerProfile) {
      throw new NotFoundException('Customer profile not found.');
    }

    const seenIds = new Set<string>();
    const validated = addresses.map((address) => {
      const label = address.label?.trim();
      const addressLine = (address.addressLine || address.line1)?.trim();
      const city = address.city?.trim();
      const pincode = (address.pincode || address.pinCode)?.trim();
      if (
        !address.id ||
        seenIds.has(address.id) ||
        !['Home', 'Work', 'Other'].includes(label) ||
        !addressLine ||
        !city ||
        !/^\d{6}$/.test(pincode)
      ) {
        throw new BadRequestException('Enter a valid address label, street address, city, and 6-digit PIN code.');
      }
      seenIds.add(address.id);
      return {
        id: address.id,
        label,
        addressLine,
        city,
        state: address.state?.trim() || 'Karnataka',
        pincode,
        isDefault: Boolean(address.isDefault),
      };
    });

    if (validated.length && !validated.some((addr) => addr.isDefault)) {
      validated[0].isDefault = true;
    }
    let defaultAssigned = false;
    for (const addr of validated) {
      if (addr.isDefault && !defaultAssigned) defaultAssigned = true;
      else addr.isDefault = false;
    }

    const updatedAccount = await this.usersRepo.replaceCustomerAddresses(
      account.customerProfile.id,
      customerId,
      validated,
    );
    return serializeAccount(updatedAccount);
  }

  async saveProvider(providerId: string, values: any, submit = false, actor?: any) {
    if (actor && actor.role !== 'admin' && actor.id !== providerId) {
      throw new ForbiddenException('You can only update your own provider profile.');
    }
    const businessName = values.businessName?.trim();
    const serviceArea = values.serviceArea?.trim();
    if (!businessName || !serviceArea || !values.skills?.length) {
      throw new BadRequestException('Enter a business name, coverage area, and at least one skill.');
    }
    if (submit && !values.documentName?.trim()) {
      throw new BadRequestException('Enter a document filename before submitting for verification.');
    }

    const updated = await this.usersRepo.saveProviderOnboarding(providerId, values, submit);
    if (!updated) throw new NotFoundException('Provider not found.');
    return serializeProvider(updated);
  }

  async moderateProvider(providerId: string, status: string, reason: string) {
    if (!['approved', 'rejected', 'changes_requested', 'suspended'].includes(status) || !reason?.trim()) {
      throw new BadRequestException('Choose a valid decision and enter an audit reason.');
    }
    const existing = await this.usersRepo.findProviderById(providerId);
    if (!existing) throw new NotFoundException('Provider not found.');
    const updated = await this.usersRepo.moderateProvider(providerId, status, reason);
    return serializeProvider(updated);
  }

  async saveAvailability(providerId: string, schedule: any, actor: any) {
    if (actor.role !== 'admin' && actor.id !== providerId) {
      throw new ForbiddenException('You can only update your own availability schedule.');
    }
    const error = validateSchedule(schedule);
    if (error) throw new BadRequestException(error);

    const normalized = {
      ...DEFAULT_SCHEDULE,
      ...schedule,
      days: [...new Set(schedule.days)],
      blackoutDates: [...new Set(schedule.blackoutDates || [])].sort(),
      leadMinutes: Number(schedule.leadMinutes ?? 0),
      bufferMinutes: Number(schedule.bufferMinutes ?? 0),
    };
    const updated = await this.usersRepo.updateAvailability(providerId, normalized);
    return serializeProvider(updated);
  }

  async deleteAccount(userId: string) {
    const existing = await this.usersRepo.findAccountById(userId);
    if (!existing) throw new NotFoundException('Account not found.');
    await this.usersRepo.deleteAccount(userId);
    return { success: true, id: userId };
  }
}
