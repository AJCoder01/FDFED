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
import { Public } from "../auth/auth.guard";
import { BookingsService } from "./bookings.service";
import { FinanceService } from "../finance/finance.service";
import {
  BookingDto,
  NoteDto,
  ProposalDto,
  ProposalResponseDto,
  ReviewDto,
  ReplyDto,
} from "../common/dto";
@ApiTags("bookings")
@Controller()
export class BookingsController {
  constructor(private s: BookingsService) {}
  @Get("bookings") list(@Req() r: any, @Query() q: any) {
    return this.s.list(r.user, q);
  }
  @Get("bookings/:id") get(@Req() r: any, @Param("id") id: string) {
    return this.s.get(r.user, id);
  }
  @Post("bookings") create(@Req() r: any, @Body() d: BookingDto) {
    return this.s.create(r.user, d);
  }
  @Public() @Get("services/:id/available-slots") slots(
    @Req() r: any,
    @Param("id") id: string,
    @Query("date") date: string,
    @Query("excludeId") excludeId?: string,
  ) {
    return this.s.availability(r.user, id, date, excludeId);
  }
  @Post("bookings/:id/accept") accept(
    @Req() r: any,
    @Param("id") id: string,
    @Body() d: NoteDto,
  ) {
    return this.s.action(r.user, id, "accept", d.note);
  }
  @Post("bookings/:id/decline") decline(
    @Req() r: any,
    @Param("id") id: string,
    @Body() d: NoteDto,
  ) {
    return this.s.action(r.user, id, "decline", d.note);
  }
  @Post("bookings/:id/start") start(
    @Req() r: any,
    @Param("id") id: string,
    @Body() d: NoteDto,
  ) {
    return this.s.action(r.user, id, "start", d.note);
  }
  @Post("bookings/:id/complete") complete(
    @Req() r: any,
    @Param("id") id: string,
    @Body() d: NoteDto,
  ) {
    return this.s.action(r.user, id, "complete", d.note);
  }
  @Post("bookings/:id/cancel") cancel(
    @Req() r: any,
    @Param("id") id: string,
    @Body() d: NoteDto,
  ) {
    return this.s.action(r.user, id, "cancel", d.note);
  }
  @Post("bookings/:id/time-proposals") propose(
    @Req() r: any,
    @Param("id") id: string,
    @Body() d: ProposalDto,
  ) {
    return this.s.propose(r.user, id, d);
  }
  @Post("bookings/:id/time-proposal-response") respond(
    @Req() r: any,
    @Param("id") id: string,
    @Body() d: ProposalResponseDto,
  ) {
    return this.s.respond(r.user, id, d.accept);
  }
  @Post("bookings/:id/review") review(
    @Req() r: any,
    @Param("id") id: string,
    @Body() d: ReviewDto,
  ) {
    return this.s.review(r.user, id, d);
  }
  @Post("bookings/:id/review-reply") reply(
    @Req() r: any,
    @Param("id") id: string,
    @Body() d: ReplyDto,
  ) {
    return this.s.reply(r.user, id, d.reply);
  }
}
@Module({
  providers: [BookingsService, FinanceService],
  controllers: [BookingsController],
  exports: [BookingsService, FinanceService],
})
export class BookingsModule {}
