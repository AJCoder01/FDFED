import {
  Body,
  Controller,
  Get,
  Post,
  Param,
  Req,
  Res,
  UploadedFile,
  UseInterceptors,
  Module,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { ApiTags, ApiConsumes, ApiBody } from "@nestjs/swagger";
import { FilesService } from "./files.service";
import { Public } from "../auth/auth.guard";
@ApiTags("files")
@Controller("uploads")
export class FilesController {
  constructor(private s: FilesService) {}
  @Post()
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        file: { type: "string", format: "binary" },
        purpose: { type: "string", enum: ["image", "evidence"] },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor("file", {
      limits: { fileSize: 5 * 1024 * 1024, files: 1 },
    }),
  )
  upload(
    @Req() r: any,
    @UploadedFile() file: Express.Multer.File,
    @Body("purpose") purpose: string,
  ) {
    return this.s.store(file, r.user.id, purpose === "image");
  }
  @Public() @Get(":id") async download(
    @Req() r: any,
    @Param("id") id: string,
    @Res() res: any,
  ) {
    const { file, buffer } = await this.s.download(r.user, id);
    res
      .set({
        "Content-Type": file.mime,
        "Content-Disposition": `${file.public ? "inline" : "attachment"}; filename="${file.filename}"`,
        "Cache-Control": file.public
          ? "public, max-age=3600"
          : "private, no-store",
        "X-Content-Type-Options": "nosniff",
      })
      .send(buffer);
  }
}
@Module({
  providers: [FilesService],
  controllers: [FilesController],
  exports: [FilesService],
})
export class FilesModule {}
