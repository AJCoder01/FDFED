import { Prisma } from "../../generated/prisma/client";
import { Actor } from "./policy";
export type Tx = Prisma.TransactionClient;
export const audit = (
  tx: Tx,
  actor: string | Actor,
  type: string,
  description: string,
) =>
  tx.auditLog.create({
    data: {
      userId:
        typeof actor === "string" ? actor : actor.demoOriginId || actor.id,
      type,
      description:
        typeof actor !== "string" && actor.demoOriginId
          ? `${description} (demo persona: ${actor.id})`
          : description,
    },
  });
export const timeline = (
  tx: Tx,
  bookingId: string,
  title: string,
  desc: string,
) => tx.bookingTimelineEvent.create({ data: { bookingId, title, desc } });
export async function notify(
  tx: Tx,
  targets: [string, string][],
  title: string,
  message: string,
) {
  await tx.notification.createMany({
    data: targets.map(([userId, targetLink]) => ({
      userId,
      targetLink,
      title,
      message,
    })),
  });
}
export async function admins(
  tx: Tx,
  path: string,
): Promise<[string, string][]> {
  return (
    await tx.user.findMany({ where: { role: "ADMIN", deletedAt: null } })
  ).map((u) => [u.id, path]);
}
export const parties = (b: {
  providerId: string;
  customerId: string;
  id: string;
}): [string, string][] => [
  [b.providerId, `/provider/jobs/${b.id}`],
  [b.customerId, `/customer/bookings/${b.id}`],
];
export async function lockProvider(tx: Tx, id: string) {
  await tx.$queryRaw`SELECT id FROM "ProviderProfile" WHERE id = ${id} FOR UPDATE`;
}
