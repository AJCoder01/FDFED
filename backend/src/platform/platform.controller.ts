import { DemoController } from "./demo.controller";
import {
  Body,
  Controller,
  Get,
  Post,
  Param,
  Query,
  Req,
  Module,
  UploadedFiles,
  UseInterceptors,
} from "@nestjs/common";
import { FileFieldsInterceptor } from "@nestjs/platform-express";
import { ApiTags, ApiConsumes } from "@nestjs/swagger";
import { Throttle } from "@nestjs/throttler";
import { PlatformService } from "./platform.service";
import { FilesModule } from "../files/files.controller";
import { Public } from "../auth/auth.guard";
import {
  ApplicationDto,
  CustomJobDto,
  RejectDto,
  NotificationDto,
} from "../common/dto";
@ApiTags("platform")
@Controller()
export class PlatformController {
  constructor(private s: PlatformService) {}
  @Get("admin/accounts") accounts(@Req() r: any, @Query() q: any) {
    return this.s.accounts(r.user, q);
  }
  @Get("admin/activity") logs(@Req() r: any, @Query() q: any) {
    return this.s.logs(r.user, q);
  }
  @Get("admin/revenue") revenue(@Req() r: any) {
    return this.s.revenue(r.user);
  }
  @Get("notifications") notifications(@Req() r: any, @Query() q: any) {
    return this.s.notifications(r.user, q);
  }
  @Post("notifications/read") read(@Req() r: any, @Body() d: NotificationDto) {
    return this.s.read(r.user, d.notificationId);
  }
  @Get("custom-job-requests") requests(@Req() r: any, @Query() q: any) {
    return this.s.requests(r.user, q);
  }
  @Post("custom-job-requests") request(@Req() r: any, @Body() d: CustomJobDto) {
    return this.s.request(r.user, d);
  }
  @Get("arbitrator-applications") applications(@Req() r: any, @Query() q: any) {
    return this.s.applications(r.user, q);
  }
  @Public()
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post("arbitrator-applications")
  @ApiConsumes("multipart/form-data")
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: "resume", maxCount: 1 },
        { name: "license", maxCount: 1 },
        { name: "cert", maxCount: 1 },
        { name: "extra", maxCount: 1 },
      ],
      { limits: { fileSize: 5 * 1024 * 1024, files: 4 } },
    ),
  )
  apply(
    @Body() d: ApplicationDto,
    @UploadedFiles() files: Record<string, Express.Multer.File[]>,
  ) {
    return this.s.apply(d, files || {});
  }
  @Post("arbitrator-applications/:id/approve") approve(
    @Req() r: any,
    @Param("id") id: string,
  ) {
    return this.s.decide(r.user, id, true);
  }
  @Post("arbitrator-applications/:id/reject") reject(
    @Req() r: any,
    @Param("id") id: string,
    @Body() d: RejectDto,
  ) {
    return this.s.decide(r.user, id, false, d.reason);
  }
}
@Module({
  imports: [FilesModule],
  providers: [PlatformService],
  controllers: [PlatformController, DemoController],
})
export class PlatformModule {}
