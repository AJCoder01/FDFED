import { Body, Controller, Post, Req, Res } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { Throttle } from "@nestjs/throttler";
import type { Response } from "express";
import { AuthService } from "./auth.service";
import { Public } from "./auth.guard";
import { LoginDto, SignupDto, DemoDto } from "../common/dto";
const cookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict" as const,
  path: "/api/v1/auth",
  maxAge: 7 * 86400000,
});
@ApiTags("auth")
@Controller("auth")
export class AuthController {
  constructor(private auth: AuthService) {}
  private deliver(res: Response, value: any) {
    const { refreshToken, ...data } = value;
    res.cookie("servicehub_refresh", refreshToken, cookieOptions());
    return data;
  }
  @Public()
  @Throttle({ default: { limit: Math.max(1, Number(process.env.AUTH_RATE_LIMIT) || 10), ttl: 60000 } })
  @Post("login")
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.deliver(res, await this.auth.login(dto));
  }
  @Public()
  @Throttle({ default: { limit: Math.max(1, Number(process.env.SIGNUP_RATE_LIMIT) || 5), ttl: 60000 } })
  @Post("signup")
  async signup(
    @Body() dto: SignupDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.deliver(res, await this.auth.signup(dto));
  }
  @Public() @Post("refresh") async refresh(
    @Req() req: any,
    @Res({ passthrough: true }) res: Response,
  ) {
    const token = req.cookies.servicehub_refresh;
    if (!token) {
      res.status(204);
      return;
    }
    return this.deliver(res, await this.auth.refresh(token));
  }
  @Public() @Post("logout") async logout(
    @Req() req: any,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.auth.logout(req.cookies.servicehub_refresh);
    res.clearCookie("servicehub_refresh", cookieOptions());
    return result;
  }
  @Post("demo-switch") async switch(
    @Req() req: any,
    @Body() dto: DemoDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.deliver(res, await this.auth.switch(req.user, dto.role));
  }
}
