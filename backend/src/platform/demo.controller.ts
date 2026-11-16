import {
  Controller,
  Post,
  Req,
  NotFoundException,
  ForbiddenException,
} from "@nestjs/common";
import { Database } from "../common/database";
import { demoEnabled } from "../auth/auth.service";
import { seedData, clearDemoDatabase } from "../../prisma/seed-data";
@Controller("admin")
export class DemoController {
  constructor(private db: Database) {}
  @Post("demo-reset") async reset(@Req() r: any) {
    if (!demoEnabled()) throw new NotFoundException();
    const origin = await this.db.user.findUnique({
      where: { id: r.user.demoOriginId || r.user.id },
    });
    if (!origin?.isSuperUser || origin.role !== "ADMIN")
      throw new ForbiddenException();
    await this.db.$transaction(
      async (tx) => {
        await clearDemoDatabase(tx);
        await seedData(tx);
      },
      { timeout: 60000 },
    );
    return {
      success: true,
      message: "Development demo database reset. Sign in again.",
    };
  }
}
