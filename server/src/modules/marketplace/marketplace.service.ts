import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ServiceStatus } from '@prisma/client';
import { MarketplaceRepository } from './marketplace.repository';
import { serializeBooking, serializeService } from '../../common/utils/serializers';
import { validateSlots } from '../bookings/scheduling.util';
import { DEFAULT_SERVICE_IMAGE } from '../../../prisma/seed-data';

@Injectable()
export class MarketplaceService {
  constructor(private readonly marketRepo: MarketplaceRepository) {}

  async getCategories() {
    const [categories, services] = await Promise.all([
      this.marketRepo.findAllCategories(),
      this.marketRepo.findAllServices(),
    ]);
    return categories.map((cat) => ({
      ...cat,
      serviceCount: services.filter(
        (s) => s.categoryId === cat.id || s.categoryName.toLowerCase() === cat.name.toLowerCase(),
      ).length,
    }));
  }

  async createCategory(body: any) {
    const name = body.name?.trim();
    if (!name) throw new BadRequestException('Category name is required.');
    const slug =
      body.slug?.trim() ||
      name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
    return this.marketRepo.createCategory({
      id: body.id || `cat-${crypto.randomUUID().slice(0, 8)}`,
      name,
      slug,
      icon: body.icon || 'Layers',
      description: body.description?.trim() || '',
      enabled: body.enabled !== false,
    });
  }

  async updateCategory(id: string, body: any) {
    const existing = await this.marketRepo.findCategoryById(id);
    if (!existing) throw new NotFoundException('Category not found.');
    return this.marketRepo.updateCategory(id, {
      name: body.name !== undefined ? body.name.trim() : existing.name,
      slug: body.slug !== undefined ? body.slug.trim() : existing.slug,
      description: body.description !== undefined ? body.description.trim() : existing.description,
      icon: body.icon !== undefined ? body.icon : existing.icon,
      enabled: body.enabled !== undefined ? Boolean(body.enabled) : existing.enabled,
    });
  }

  async deleteCategory(id: string) {
    const existing = await this.marketRepo.findCategoryById(id);
    if (!existing) throw new NotFoundException('Category not found.');
    await this.marketRepo.deleteCategory(id);
    return { success: true, id };
  }

  async getServices(filters: {
    role?: string;
    userId?: string;
    category?: string;
    search?: string;
    maxPrice?: string;
    sort?: string;
  }) {
    const [allServices, allReviews] = await Promise.all([
      this.marketRepo.findAllServices(),
      this.marketRepo.findAllReviews(),
    ]);

    let list = allServices.map((s) => serializeService(s, allReviews));
    if (filters.role === 'provider' && filters.userId) {
      list = list.filter((s) => s.providerId === filters.userId);
    } else if (filters.role !== 'admin') {
      list = list.filter((s) => s.status === 'published' && s.providerVerificationStatus === 'approved');
    }

    if (filters.category) {
      list = list.filter((s) => s.categoryId === filters.category || s.categoryName === filters.category);
    }
    if (filters.search?.trim()) {
      const q = filters.search.trim().toLowerCase();
      list = list.filter((s) =>
        `${s.title || ''} ${s.categoryName || ''} ${s.description || ''}`.toLowerCase().includes(q),
      );
    }
    if (filters.maxPrice) {
      list = list.filter((s) => s.price <= Number(filters.maxPrice));
    }

    if (filters.sort === 'price_low') list.sort((a, b) => a.price - b.price);
    if (filters.sort === 'price_high') list.sort((a, b) => b.price - a.price);
    if (filters.sort === 'rating') list.sort((a, b) => (b.rating || 0) - (a.rating || 0));

    return list;
  }

  async getServiceById(serviceId: string, actor?: any) {
    const [service, reviews] = await Promise.all([
      this.marketRepo.findServiceById(serviceId),
      this.marketRepo.findReviewsByService(serviceId),
    ]);
    if (!service) throw new NotFoundException('Service not found.');

    const isOwner = actor?.role === 'provider' && actor?.id === service.providerId;
    const isAdmin = actor?.role === 'admin';
    const isPublic = service.status === ServiceStatus.PUBLISHED && service.provider?.verificationStatus === 'approved';
    if (!isOwner && !isAdmin && !isPublic) {
      throw new NotFoundException('Service not found.');
    }
    return serializeService(service, reviews);
  }

  async saveService(values: any, actor: any) {
    const existing = values.id ? await this.marketRepo.findServiceById(values.id) : null;
    if (values.id && !existing) throw new NotFoundException('Listing not found.');

    const providerId = values.providerId || existing?.providerId || actor.id;
    if (actor.role !== 'admin' && providerId !== actor.id) {
      throw new ForbiddenException('This record does not belong to your account.');
    }

    const provider = await this.marketRepo.findProviderById(providerId);
    if (!provider) throw new NotFoundException('Provider not found.');

    const statusLower = String(values.status || existing?.status || 'published').toLowerCase();
    const statusMap: Record<string, ServiceStatus> = {
      draft: ServiceStatus.DRAFT,
      published: ServiceStatus.PUBLISHED,
      paused: ServiceStatus.PAUSED,
      archived: ServiceStatus.ARCHIVED,
      flagged: ServiceStatus.FLAGGED,
    };
    const mappedStatus = statusMap[statusLower];
    if (!mappedStatus) throw new BadRequestException('Invalid listing status.');

    if (mappedStatus === ServiceStatus.PUBLISHED && provider.verificationStatus !== 'approved' && actor.role !== 'admin') {
      throw new BadRequestException('An approved provider profile is required to publish.');
    }

    const title = (values.title ?? existing?.title ?? '').trim();
    const description = (values.description ?? existing?.description ?? '').trim();
    const categoryId = values.categoryId || existing?.categoryId;
    const category = categoryId ? await this.marketRepo.findCategoryById(categoryId) : null;
    if (!title || !description || !category) {
      throw new BadRequestException('Enter a title, category, and description.');
    }

    const priceInr = Number(values.price ?? values.priceInr ?? existing?.priceInr);
    if (!Number.isFinite(priceInr) || priceInr <= 0) {
      throw new BadRequestException('Enter a positive service price.');
    }

    const durationRaw = values.duration ?? existing?.duration ?? '60 mins';
    const durationMinutes = Number.parseInt(String(values.durationMinutes ?? durationRaw), 10);
    if (!Number.isInteger(durationMinutes) || durationMinutes <= 0 || durationMinutes > 1440) {
      throw new BadRequestException('Enter a valid duration.');
    }

    const slots: string[] = Array.isArray(values.availableSlots)
      ? values.availableSlots
      : Array.isArray(existing?.availableSlots)
        ? (existing.availableSlots as string[])
        : [];
    const slotError = validateSlots(slots, durationMinutes);
    if (slotError && mappedStatus !== ServiceStatus.DRAFT) {
      throw new BadRequestException(slotError);
    }

    const saved = await this.marketRepo.upsertService({
      id: existing?.id || `srv-${crypto.randomUUID().slice(0, 8)}`,
      isUpdate: Boolean(existing),
      providerId,
      categoryId: category.id,
      categoryName: category.name,
      providerName: provider.businessName,
      title,
      description,
      priceInr,
      durationMinutes,
      duration: typeof durationRaw === 'string' && durationRaw.includes('min') ? durationRaw : `${durationMinutes} mins`,
      mode: values.mode || existing?.mode || 'On-site',
      image: values.image || existing?.image || DEFAULT_SERVICE_IMAGE,
      inclusions: Array.isArray(values.inclusions) ? values.inclusions : ((existing?.inclusions as string[]) || []),
      exclusions: Array.isArray(values.exclusions) ? values.exclusions : ((existing?.exclusions as string[]) || []),
      policy:
        (values.policy || existing?.policy || 'Free cancellation up to 2 hours from booking; cancellation charges apply thereafter.').trim(),
      freeCancellationHours:
        values.freeCancellationHours !== undefined
          ? Math.max(0, Number(values.freeCancellationHours))
          : existing?.freeCancellationHours ?? 2,
      cancellationFeePercent:
        values.cancellationFeePercent !== undefined
          ? Math.max(0, Math.min(100, Number(values.cancellationFeePercent)))
          : existing?.cancellationFeePercent ?? 20,
      availableSlots: slots,
      status: mappedStatus,
    });

    const reviews = await this.marketRepo.findReviewsByService(saved.id);
    return serializeService(saved, reviews);
  }

  async deleteService(serviceId: string, actor: any) {
    const existing = await this.marketRepo.findServiceById(serviceId);
    if (!existing) throw new NotFoundException('Listing not found.');
    if (actor.role === 'provider' && existing.providerId !== actor.id) {
      throw new ForbiddenException('This record does not belong to your account.');
    }
    await this.marketRepo.deleteService(serviceId);
    return { success: true, serviceId };
  }

  async getServiceReviews(serviceId: string) {
    const reviews = await this.marketRepo.findReviewsByService(serviceId);
    return reviews.map((r) => ({
      id: r.bookingId,
      reviewId: r.id,
      customerName: r.customerName,
      rating: r.rating,
      comment: r.comment,
      reply: r.reply,
      date: r.createdAt instanceof Date ? r.createdAt.toISOString() : r.createdAt,
    }));
  }

  async submitReview(bookingId: string, rating: number, comment: string, actor: any) {
    if (!Number.isInteger(rating) || rating < 1 || rating > 5 || !comment?.trim()) {
      throw new BadRequestException('Choose a rating from 1 to 5 and enter a review.');
    }
    const result = await this.marketRepo.createReviewForBooking(bookingId, actor.id, rating, comment);
    if ('error' in result) throw new BadRequestException(result.error);
    return serializeBooking(result.booking);
  }

  async replyToReview(bookingId: string, reply: string, actor: any) {
    if (!reply?.trim()) throw new BadRequestException('Enter a reply to an existing review.');
    const result = await this.marketRepo.replyToBookingReview(bookingId, actor.id, reply, actor.role === 'admin');
    if ('error' in result) throw new BadRequestException(result.error);
    return serializeBooking(result.booking);
  }

  async getJobRequests(actor: any) {
    const customerId = actor.role === 'customer' ? actor.id : undefined;
    const rows = await this.marketRepo.findJobRequests(customerId);
    return rows.map((r) => ({
      ...r,
      budget: r.budgetInr,
      category: r.categoryName,
      createdAt: r.createdAt instanceof Date ? r.createdAt.toISOString() : r.createdAt,
    }));
  }

  async createJobRequest(body: any, actor: any) {
    if (!body.title?.trim() || !body.description?.trim()) {
      throw new BadRequestException('Please fill in the job title and detailed description.');
    }
    const categories = await this.marketRepo.findAllCategories();
    const matchedCategory = categories.find(
      (c) => c.id === body.categoryId || c.name.toLowerCase() === String(body.category || '').toLowerCase(),
    );
    const requestCode = `REQ-${Math.floor(1000 + Math.random() * 9000)}`;
    const created = await this.marketRepo.createJobRequest({
      id: requestCode,
      requestCode,
      customerId: actor.id,
      categoryId: matchedCategory?.id,
      categoryName: matchedCategory?.name || body.category || 'Others',
      title: body.title.trim(),
      description: body.description.trim(),
      location: body.location?.trim() || 'Bengaluru',
      budgetInr: Number(body.budget ?? body.budgetInr ?? 0),
      preferredDate: body.preferredDate || '',
      contactName: body.contactName?.trim() || actor.name || 'Customer',
      contactPhone: body.contactPhone?.trim() || '',
    });
    return {
      ...created,
      budget: created.budgetInr,
      category: created.categoryName,
      createdAt: created.createdAt instanceof Date ? created.createdAt.toISOString() : created.createdAt,
    };
  }

  async deleteJobRequest(id: string) {
    await this.marketRepo.deleteJobRequest(id);
    return { success: true, id };
  }
}
