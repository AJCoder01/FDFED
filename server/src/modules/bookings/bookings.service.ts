import { BadRequestException, HttpException, Injectable, NotFoundException } from '@nestjs/common';
import { BookingsRepository } from './bookings.repository';
import { serializeBooking } from '../../common/utils/serializers';
import { availableSlots } from './scheduling.util';

@Injectable()
export class BookingsService {
  constructor(private readonly bookingsRepo: BookingsRepository) {}

  async getBookings(role?: string, userId?: string) {
    const bookings = await this.bookingsRepo.findAllBookings(role, userId);
    return bookings.map(serializeBooking);
  }

  async getBookingById(bookingId: string) {
    const booking = await this.bookingsRepo.findBookingById(bookingId);
    if (!booking) throw new NotFoundException('Booking not found.');
    return serializeBooking(booking);
  }

  async getAvailableSlots(serviceId: string, date: string, excludeId?: string) {
    const { service, provider, services, bookings } = await this.bookingsRepo.getAvailableSlotsContext(serviceId);
    return availableSlots(service, provider, date, bookings, services, excludeId);
  }

  async createBooking(values: any, actor: any) {
    const customerId = values.customerId || actor.id;
    const customerName = values.customerName || actor.name;
    if (!customerId || !customerName?.trim() || !values.address?.trim()) {
      throw new BadRequestException('Enter the customer details and service address.');
    }

    const result = await this.bookingsRepo.createBookingTransaction({
      ...values,
      customerId,
      customerName,
    });
    if ('error' in result) throw new BadRequestException(result.error);
    return serializeBooking(result.booking);
  }

  async updateBookingStatus(bookingId: string, body: { status: string; note?: string; expectedStatus?: string }, actor: any) {
    const result = await this.bookingsRepo.updateStatusTransaction(bookingId, body.status, body.note || '', {
      ...actor,
      expectedStatus: body.expectedStatus,
    });
    if ('error' in result) {
      throw new HttpException(result.error, result.statusCode || 400);
    }
    return serializeBooking(result.booking);
  }

  async proposeTime(bookingId: string, date: string, slot: string, actor: any) {
    const result = await this.bookingsRepo.proposeTimeTransaction(bookingId, date, slot, actor.id);
    if ('error' in result) throw new BadRequestException(result.error);
    return serializeBooking(result.booking);
  }

  async respondToTimeProposal(bookingId: string, accept: boolean, actor: any) {
    const result = await this.bookingsRepo.respondTimeProposalTransaction(bookingId, Boolean(accept), actor.id);
    if ('error' in result) throw new BadRequestException(result.error);
    return serializeBooking(result.booking);
  }

  async deleteBooking(bookingId: string) {
    const existing = await this.bookingsRepo.findBookingById(bookingId);
    if (!existing) throw new NotFoundException('Booking not found.');
    await this.bookingsRepo.deleteBooking(bookingId);
    return { success: true, id: bookingId };
  }
}
