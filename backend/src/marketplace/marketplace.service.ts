import { BadRequestException, Injectable } from "@nestjs/common";
import { Database } from "../common/database";
import { Actor, own, roles, found, paginate } from "../common/policy";
import { listingInclude, listingView } from "../common/serializers";
import { ListingDto, ListingPatchDto } from "../common/dto";
import { minor } from "../finance/finance.service";
import { validateSlots } from "../bookings/scheduling";
import { audit, lockProvider } from "../common/effects";
export const publicListing = {
  deletedAt: null,
  status: "published" as const,
  provider: { verificationStatus: "approved" as const },
};
@Injectable()
export class MarketplaceService {
  constructor(private db: Database) {}
  async categories() {
    const rows = await this.db.serviceCategory.findMany({
      include: { _count: { select: { services: { where: publicListing } } } },
    });
    return rows.map(({ _count, ...c }) => ({
      ...c,
      serviceCount: _count.services,
    }));
  }
  async list(a: Actor | undefined, q: any) {
    let where: any = { ...publicListing };
    if (q.scope === "manage") {
      roles(a!, "PROVIDER", "ADMIN");
      where = {
        deletedAt: null,
        ...(a!.role === "PROVIDER" ? { providerId: a!.id } : {}),
      };
    }
    if (q.category)
      where = {
        ...where,
        OR: [{ categoryId: q.category }, { category: { name: q.category } }],
      };
    if (q.search)
      where = {
        ...where,
        AND: [
          {
            OR: [
              { title: { contains: q.search, mode: "insensitive" } },
              { description: { contains: q.search, mode: "insensitive" } },
              {
                category: { name: { contains: q.search, mode: "insensitive" } },
              },
            ],
          },
        ],
      };
    if (q.maxPrice) where.priceMinor = { lte: minor(q.maxPrice) };
    const items = (
      await this.db.serviceListing.findMany({
        where,
        include: listingInclude,
        orderBy: { createdAt: "desc" },
      })
    ).map(listingView);
    if (q.sort === "price_low") items.sort((a, b) => a.price - b.price);
    if (q.sort === "price_high") items.sort((a, b) => b.price - a.price);
    if (q.sort === "rating")
      items.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    return paginate(items, q);
  }
  async get(a: Actor | undefined, id: string) {
    const s = await this.db.serviceListing.findUnique({
      where: { id },
      include: listingInclude,
    });
    if (!s || s.deletedAt) return null;
    if (
      a?.role !== "ADMIN" &&
      a?.id !== s.providerId &&
      (s.status !== "published" || s.provider.verificationStatus !== "approved")
    )
      return null;
    return listingView(s);
  }
  async save(
    a: Actor,
    id: string | undefined,
    d: ListingDto | ListingPatchDto,
  ) {
    roles(a, "PROVIDER", "ADMIN");
    if (!id && a.role !== "PROVIDER")
      throw new BadRequestException(
        "Listings must be created by their provider.",
      );
    const original = id
      ? found(
          await this.db.serviceListing.findUnique({
            where: { id },
            include: listingInclude,
          }),
        )
      : null;
    if (original) own(a, original.providerId);
    const providerId = original?.providerId || a.id;
    return this.db.$transaction(async (tx) => {
      await lockProvider(tx, providerId);
      const existing = id
        ? found(
            await tx.serviceListing.findUnique({
              where: { id },
              include: listingInclude,
            }),
          )
        : null;
      if (existing?.deletedAt)
        throw new BadRequestException("Archived listings cannot be edited.");
      const p = found(
        await tx.providerProfile.findUnique({ where: { id: providerId } }),
      );
      const v = { ...(existing ? listingView(existing) : {}), ...d };
      const durationMinutes = parseInt(v.duration, 10);
      if (v.status === "published" && p.verificationStatus !== "approved")
        throw new BadRequestException(
          "An approved provider profile is required to publish.",
        );
      if (
        !v.title?.trim() ||
        !v.description?.trim() ||
        !Number.isInteger(durationMinutes) ||
        durationMinutes < 1 ||
        durationMinutes > 1440
      )
        throw new BadRequestException(
          "Enter a valid title, description and duration.",
        );
      const error = validateSlots(v.availableSlots || [], durationMinutes);
      if (error && v.status !== "draft") throw new BadRequestException(error);
      if (v.image && !/^(https?:\/\/|\/api\/v1\/uploads\/)/.test(v.image))
        throw new BadRequestException("Upload a listing image first.");
      const data = {
        providerId,
        categoryId: v.categoryId,
        title: v.title.trim(),
        description: v.description.trim(),
        priceMinor: minor(v.price),
        durationMinutes,
        image: v.image || "",
        inclusions: v.inclusions || [],
        exclusions: v.exclusions || [],
        policy: v.policy || "",
        availableSlots: v.availableSlots || [],
        status: v.status,
      };
      const s = id
        ? await tx.serviceListing.update({
            where: { id },
            data,
            include: listingInclude,
          })
        : await tx.serviceListing.create({ data, include: listingInclude });
      await audit(tx, a, "LISTING_SAVED", s.id);
      return listingView(s);
    });
  }
  async remove(a: Actor, id: string) {
    roles(a, "PROVIDER", "ADMIN");
    const s = found(await this.db.serviceListing.findUnique({ where: { id } }));
    own(a, s.providerId);
    await this.db.$transaction(async (tx) => {
      await lockProvider(tx, s.providerId);
      await tx.serviceListing.update({
        where: { id },
        data: { status: "archived", deletedAt: new Date() },
      });
      await audit(tx, a, "LISTING_ARCHIVED", id);
    });
    return { success: true, serviceId: id };
  }
  async reviews(a: Actor | undefined, id: string) {
    if (!(await this.get(a, id))) return [];
    return (
      await this.db.review.findMany({
        where: { booking: { serviceId: id } },
        include: { booking: { select: { customerName: true } } },
      })
    ).map((r) => ({
      id: r.bookingId,
      customerName: r.booking.customerName,
      rating: r.rating,
      comment: r.comment,
      reply: r.reply,
      date: r.createdAt,
    }));
  }
}
