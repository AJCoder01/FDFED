import { BadRequestException, ForbiddenException, NotFoundException } from "@nestjs/common";
import { User } from "../../generated/prisma/client";
export type Actor = User & { sessionId: string; demoOriginId?: string | null };
export function roles(actor: Actor, ...allowed: string[]) {
  if (!actor || !allowed.includes(actor.role))
    throw new ForbiddenException("This action is not permitted.");
}
export function own(actor: Actor, ownerId: string | null, admin = true) {
  if (actor.id !== ownerId && !(admin && actor.role === "ADMIN"))
    throw new ForbiddenException(
      "This record does not belong to your account.",
    );
}
export function found<T>(value: T | null | undefined): T {
  if (!value) throw new NotFoundException("Record not found.");
  return value;
}
export function paging(q: { page?: string; limit?: string }) {
  const page = q.page === undefined ? 1 : Number(q.page);
  const limit = q.limit === undefined ? 100 : Number(q.limit);
  if (!Number.isSafeInteger(page) || page < 1 || !Number.isSafeInteger(limit) || limit < 1 || limit > 100)
    throw new BadRequestException("page must be a positive integer and limit must be between 1 and 100.");
  return { page, limit };
}
export function paginate<T>(items: T[], q: any = {}) {
  const { page, limit } = paging(q);
  return {
    items: items.slice((page - 1) * limit, page * limit),
    total: items.length,
    page,
    limit,
  };
}
