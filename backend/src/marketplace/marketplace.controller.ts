import {
  Body,
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Query,
  Req,
  Res,
  Module,
} from "@nestjs/common";
import type { Response } from "express";
import { ApiTags } from "@nestjs/swagger";
import { MarketplaceService } from "./marketplace.service";
import { ListingDto, ListingPatchDto } from "../common/dto";
import { Public } from "../auth/auth.guard";
@ApiTags("marketplace")
@Controller()
export class MarketplaceController {
  constructor(private s: MarketplaceService) {}
  @Public() @Get("categories") categories() {
    return this.s.categories();
  }
  @Public() @Get("services") list(@Req() r: any, @Query() q: any) {
    return this.s.list(r.user, q);
  }
  @Public() @Get("services/:id") async get(
    @Req() r: any,
    @Param("id") id: string,
    @Res() response: Response,
  ) {
    response.json(await this.s.get(r.user, id));
  }
  @Public() @Get("services/:id/reviews") reviews(
    @Req() r: any,
    @Param("id") id: string,
  ) {
    return this.s.reviews(r.user, id);
  }
  @Post("services") create(@Req() r: any, @Body() d: ListingDto) {
    return this.s.save(r.user, undefined, d);
  }
  @Patch("services/:id") update(
    @Req() r: any,
    @Param("id") id: string,
    @Body() d: ListingPatchDto,
  ) {
    return this.s.save(r.user, id, d);
  }
  @Delete("services/:id") remove(@Req() r: any, @Param("id") id: string) {
    return this.s.remove(r.user, id);
  }
}
@Module({
  providers: [MarketplaceService],
  controllers: [MarketplaceController],
})
export class MarketplaceModule {}
