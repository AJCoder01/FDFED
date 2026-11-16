import {
  Body,
  Controller,
  Get,
  Patch,
  Put,
  Post,
  Param,
  Req,
  Query,
  Module,
} from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { UsersService } from "./users.service";
import {
  ProfileDto,
  AddressesDto,
  ProviderDto,
  ScheduleDto,
  ModerationDto,
} from "../common/dto";
import { Public } from "../auth/auth.guard";
@ApiTags("users")
@Controller()
export class UsersController {
  constructor(private service: UsersService) {}
  @Get("users/me") me(@Req() r: any) {
    return this.service.me(r.user);
  }
  @Patch("users/me") profile(@Req() r: any, @Body() d: ProfileDto) {
    return this.service.profile(r.user, d);
  }
  @Put("customers/me/addresses") addresses(
    @Req() r: any,
    @Body() d: AddressesDto,
  ) {
    return this.service.addresses(r.user, d);
  }
  @Get("providers") providers(@Req() r: any, @Query() q: any) {
    return this.service.providers(r.user, q);
  }
  @Public() @Get("providers/:id") provider(
    @Req() r: any,
    @Param("id") id: string,
  ) {
    return this.service.provider(r.user, id);
  }
  @Put("providers/me") save(@Req() r: any, @Body() d: ProviderDto) {
    return this.service.saveProvider(r.user, d);
  }
  @Put("providers/me/availability") schedule(
    @Req() r: any,
    @Body() d: ScheduleDto,
  ) {
    return this.service.schedule(r.user, d);
  }
  @Post("providers/:id/moderation") moderate(
    @Req() r: any,
    @Param("id") id: string,
    @Body() d: ModerationDto,
  ) {
    return this.service.moderate(r.user, id, d);
  }
}
@Module({ providers: [UsersService], controllers: [UsersController] })
export class UsersModule {}
