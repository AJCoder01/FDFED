import { BadRequestException, Injectable } from "@nestjs/common";
import { Database } from "../common/database";
import { Actor, own, roles, found, paginate } from "../common/policy";
import { userInclude, userView } from "../common/serializers";
import {
  AddressesDto,
  ProfileDto,
  ProviderDto,
  ScheduleDto,
  ModerationDto,
} from "../common/dto";
import { audit, notify, admins, lockProvider } from "../common/effects";
import { validateSchedule } from "../bookings/scheduling";
import { demoEnabled } from "../auth/auth.service";
@Injectable()
export class UsersService {
  constructor(private db: Database) {}
  async me(a: Actor) {
    return {
      ...userView(
        await this.db.user.findUniqueOrThrow({
          where: { id: a.id },
          include: userInclude,
        }),
      ),
      demoEnabled: demoEnabled(),
      canDemoSwitch: demoEnabled() && (a.isSuperUser || !!a.demoOriginId),
    };
  }
  async profile(a: Actor, d: ProfileDto) {
    if (d.avatar && !/^(https?:\/\/|\/api\/v1\/uploads\/)/.test(d.avatar))
      throw new BadRequestException("Upload a profile image first.");
    await this.db.$transaction(async (tx) => {
      await tx.user.update({ where: { id: a.id }, data: d });
      await audit(tx, a, "PROFILE_UPDATE", "Profile updated");
    });
    return this.me(a);
  }
  async addresses(a: Actor, d: AddressesDto) {
    roles(a, "CUSTOMER");
    const ids = d.addresses.map((x) => x.id);
    if (new Set(ids).size !== ids.length)
      throw new BadRequestException("Address IDs must be unique.");
    const preferred = d.addresses.findIndex((x) => x.isDefault);
    const defaultIndex = preferred < 0 ? 0 : preferred;
    await this.db.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM "User" WHERE id=${a.id} FOR UPDATE`;
      await tx.customerAddress.deleteMany({ where: { userId: a.id } });
      await tx.customerAddress.createMany({
        data: d.addresses.map((x, i) => ({
          ...x,
          userId: a.id,
          isDefault: i === defaultIndex,
        })),
      });
      await audit(tx, a, "ADDRESSES_UPDATED", "Saved address book");
    });
    return this.me(a);
  }
  async provider(a: Actor | undefined, id: string) {
    const u = found(
      await this.db.user.findUnique({ where: { id }, include: userInclude }),
    );
    if (!u.provider) throw new BadRequestException("Not a provider.");
    if (a && (a.id === id || a.role === "ADMIN")) return userView(u);
    if (u.provider.verificationStatus !== "approved") return null;
    return {
      id,
      name: u.name,
      avatar: u.avatar,
      businessName: u.provider.businessName,
      serviceArea: u.provider.serviceArea,
      skills: u.provider.skills,
      verificationStatus: u.provider.verificationStatus,
    };
  }
  async providers(a: Actor, q: any) {
    roles(a, "ADMIN");
    return paginate(
      (
        await this.db.user.findMany({
          where: { role: "PROVIDER", deletedAt: null },
          include: userInclude,
        })
      ).map(userView),
      q,
    );
  }
  async saveProvider(a: Actor, d: ProviderDto) {
    roles(a, "PROVIDER");
    if (!d.skills.length || !d.businessName.trim() || !d.serviceArea.trim())
      throw new BadRequestException(
        "Business name, coverage and skills are required.",
      );
    await this.db.$transaction(async (tx) => {
      await lockProvider(tx, a.id);
      const p = found(
        await tx.providerProfile.findUnique({ where: { id: a.id } }),
      );
      if (
        d.submit &&
        (!d.documentName?.trim() || p.verificationStatus === "suspended")
      )
        throw new BadRequestException(
          "Supply a verification document reference; suspended profiles require admin review.",
        );
      const {
        businessName,
        serviceArea,
        skills,
        documentName,
        submit,
        ...profile
      } = d;
      if (
        profile.avatar &&
        !/^(https?:\/\/|\/api\/v1\/uploads\/)/.test(profile.avatar)
      )
        throw new BadRequestException("Upload a profile image first.");
      await tx.user.update({ where: { id: a.id }, data: profile });
      await tx.providerProfile.update({
        where: { id: a.id },
        data: {
          businessName: businessName.trim(),
          serviceArea,
          skills,
          documentName,
          ...(submit
            ? {
                verificationStatus: "submitted",
                verificationFeedback: "Submitted for Admin review.",
              }
            : {}),
        },
      });
      if (submit)
        await notify(
          tx,
          await admins(tx, "/admin/providers"),
          "Provider Verification Submitted",
          businessName,
        );
      await audit(
        tx,
        a,
        "PROVIDER_PROFILE_UPDATED",
        submit ? "Submitted verification" : "Updated provider profile",
      );
    });
    return this.me(a);
  }
  async schedule(a: Actor, d: ScheduleDto) {
    roles(a, "PROVIDER");
    const error = validateSchedule(d);
    if (error) throw new BadRequestException(error);
    await this.db.$transaction(async (tx) => {
      await lockProvider(tx, a.id);
      await tx.providerAvailability.upsert({
        where: { providerId: a.id },
        create: { ...d, providerId: a.id },
        update: d,
      });
      await audit(tx, a, "AVAILABILITY_UPDATED", "Working schedule saved");
    });
    return this.me(a);
  }
  async moderate(a: Actor, id: string, d: ModerationDto) {
    roles(a, "ADMIN");
    await this.db.$transaction(async (tx) => {
      await lockProvider(tx, id);
      await tx.providerProfile.update({
        where: { id },
        data: { verificationStatus: d.status, verificationFeedback: d.reason },
      });
      await notify(
        tx,
        [[id, "/provider/profile"]],
        "Verification Updated",
        `${d.status}: ${d.reason}`,
      );
      await audit(
        tx,
        a,
        "PROVIDER_MODERATED",
        `${id}: ${d.status}: ${d.reason}`,
      );
    });
    return this.provider(a, id);
  }
}
