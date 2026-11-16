import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { randomBytes, createHash } from "node:crypto";
import * as argon2 from "argon2";
import { Database } from "../common/database";
import { LoginDto, SignupDto } from "../common/dto";
import { userInclude, userView } from "../common/serializers";
import { Actor } from "../common/policy";
import { audit, Tx } from "../common/effects";
export const digest = (token: string) =>
  createHash("sha256").update(token).digest("hex");
export const demoEnabled = () =>
  process.env.NODE_ENV !== "production" && process.env.DEMO_ENABLED === "true";
@Injectable()
export class AuthService {
  constructor(
    private db: Database,
    private jwt: JwtService,
  ) {}
  async signup(dto: SignupDto) {
    const { email, password, name, phone, role } = dto;
    if (!["customer", "provider"].includes(role))
      throw new BadRequestException("Choose customer or provider.");
    const passwordHash = await argon2.hash(password);
    const u = await this.db.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email,
          passwordHash,
          name: name.trim(),
          phone,
          role: role === "customer" ? "CUSTOMER" : "PROVIDER",
          location: dto.city || dto.serviceArea || "",
          ...(role === "provider"
            ? {
                provider: {
                  create: {
                    businessName: dto.businessName || `${name}'s Services`,
                    serviceArea: dto.serviceArea || "",
                    skills: dto.skills || [],
                    availability: { create: {} },
                  },
                },
              }
            : {}),
        },
      });
      if (role === "customer" && dto.addressLine) {
        if (!dto.city || !dto.pincode)
          throw new BadRequestException("City and PIN code are required.");
        await tx.customerAddress.create({
          data: {
            userId: user.id,
            label: dto.addressLabel || "Home",
            addressLine: dto.addressLine,
            city: dto.city,
            pincode: dto.pincode,
            isDefault: true,
          },
        });
      }
      await audit(tx, user.id, "SIGNUP", "Account registered");
      return user;
    });
    return this.session(u.id);
  }
  async login(dto: LoginDto) {
    const u = await this.db.user.findUnique({ where: { email: dto.email } });
    if (
      !u ||
      u.deletedAt ||
      !(await argon2.verify(u.passwordHash, dto.password))
    )
      throw new UnauthorizedException("Invalid credentials.");
    if (dto.role && u.role.toLowerCase() !== dto.role)
      throw new UnauthorizedException(
        "Please select the account’s registered role.",
      );
    await audit(this.db, u.id, "LOGIN", "Signed in");
    return this.session(u.id);
  }
  async session(
    userId: string,
    demoOriginId?: string | null,
    tx: Tx = this.db,
  ) {
    const token = randomBytes(48).toString("base64url");
    const s = await tx.userSession.create({
      data: {
        userId,
        tokenHash: digest(token),
        demoOriginId,
        expiresAt: new Date(Date.now() + 7 * 86400000),
      },
    });
    const u = await tx.user.findUniqueOrThrow({
      where: { id: userId },
      include: userInclude,
    });
    return {
      refreshToken: token,
      accessToken: await this.jwt.signAsync(
        { sub: u.id, sid: s.id },
        { expiresIn: "15m" },
      ),
      user: {
        ...userView(u),
        demoEnabled: demoEnabled(),
        canDemoSwitch: demoEnabled() && (u.isSuperUser || !!demoOriginId),
      },
    };
  }
  async refresh(token?: string) {
    if (!token) throw new UnauthorizedException();
    const s = await this.db.userSession.findUnique({
      where: { tokenHash: digest(token) },
      include: { user: true },
    });
    if (!s || s.revokedAt || s.expiresAt < new Date() || s.user.deletedAt)
      throw new UnauthorizedException("Session expired.");
    return this.db.$transaction(async (tx) => {
      const claimed = await tx.userSession.updateMany({
        where: { id: s.id, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      if (!claimed.count)
        throw new UnauthorizedException("Refresh token already used.");
      return this.session(s.userId, s.demoOriginId, tx);
    });
  }
  async logout(token?: string) {
    if (token)
      await this.db.$transaction(async (tx) => {
        const session = await tx.userSession.findUnique({
          where: { tokenHash: digest(token) },
        });
        if (!session) return;
        const revoked = await tx.userSession.updateMany({
          where: { id: session.id, revokedAt: null },
          data: { revokedAt: new Date() },
        });
        if (revoked.count)
          await audit(
            tx,
            session.demoOriginId || session.userId,
            "LOGOUT",
            "Signed out",
          );
      });
    return { success: true };
  }
  async switch(actor: Actor, role: string) {
    if (!demoEnabled()) throw new NotFoundException();
    const origin = await this.db.user.findUnique({
      where: { id: actor.demoOriginId || actor.id },
    });
    if (!origin?.isSuperUser || origin.role !== "ADMIN" || origin.deletedAt)
      throw new ForbiddenException();
    const id = (
      {
        customer: "user-cust-1",
        provider: "user-prov-1",
        admin: "user-admin-2",
        staffAdmin: "user-admin-2",
        superuser: "user-admin-1",
        arbitrator: "user-arbit-1",
      } as Record<string, string>
    )[role];
    if (!id) throw new BadRequestException();
    return this.db.$transaction(async (tx) => {
      await audit(tx, origin.id, "DEMO_SWITCH", `Impersonated ${id}`);
      const claimed = await tx.userSession.updateMany({
        where: { id: actor.sessionId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      if (!claimed.count)
        throw new UnauthorizedException("Session already used.");
      return this.session(id, origin.id, tx);
    });
  }
}
