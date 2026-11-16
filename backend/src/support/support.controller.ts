import {
  Body,
  Controller,
  Get,
  Post,
  Param,
  Query,
  Req,
  Module,
} from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { SupportService } from "./support.service";
import { BookingsModule } from "../bookings/bookings.controller";
import {
  DisputeDto,
  TicketDto,
  ResolutionDto,
  ResponseDto,
  AssignmentDto,
  HearingDto,
  RulingDto,
} from "../common/dto";
@ApiTags("support and arbitration")
@Controller()
export class SupportController {
  constructor(private s: SupportService) {}
  @Get("tickets") tickets(@Req() r: any, @Query() q: any) {
    return this.s.tickets(r.user, q);
  }
  @Post("tickets") ticket(@Req() r: any, @Body() d: TicketDto) {
    return this.s.ticket(r.user, d);
  }
  @Post("tickets/:id/resolve") resolve(
    @Req() r: any,
    @Param("id") id: string,
    @Body() d: ResolutionDto,
  ) {
    return this.s.resolve(r.user, id, d.outcome);
  }
  @Get("disputes") disputes(@Req() r: any, @Query() q: any) {
    return this.s.disputes(r.user, q);
  }
  @Get("disputes/:id") get(@Req() r: any, @Param("id") id: string) {
    return this.s.get(r.user, id);
  }
  @Post("disputes") file(@Req() r: any, @Body() d: DisputeDto) {
    return this.s.file(r.user, d);
  }
  @Post("disputes/:id/response") response(
    @Req() r: any,
    @Param("id") id: string,
    @Body() d: ResponseDto,
  ) {
    return this.s.response(r.user, id, d);
  }
  @Post("disputes/:id/assignment") assign(
    @Req() r: any,
    @Param("id") id: string,
    @Body() d: AssignmentDto,
  ) {
    return this.s.assign(r.user, id, d.arbitratorId);
  }
  @Post("disputes/:id/hearing") hearing(
    @Req() r: any,
    @Param("id") id: string,
    @Body() d: HearingDto,
  ) {
    return this.s.hearing(r.user, id, d);
  }
  @Post("disputes/:id/ruling") ruling(
    @Req() r: any,
    @Param("id") id: string,
    @Body() d: RulingDto,
  ) {
    return this.s.ruling(r.user, id, d);
  }
}
@Module({
  imports: [BookingsModule],
  providers: [SupportService],
  controllers: [SupportController],
})
export class SupportModule {}
