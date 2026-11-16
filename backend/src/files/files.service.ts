import {
  BadRequestException,
  Injectable,
  ForbiddenException,
} from "@nestjs/common";
import { mkdir, writeFile, readFile, unlink } from "node:fs/promises";
import { resolve, basename } from "node:path";
import { randomUUID } from "node:crypto";
import { Database } from "../common/database";
import { Actor, found } from "../common/policy";
@Injectable()
export class FilesService {
  constructor(private db: Database) {}
  root() {
    return resolve(process.env.UPLOAD_DIR || "./uploads");
  }
  validate(f: Express.Multer.File) {
    if (!f || f.size > 5 * 1024 * 1024 || !f.size)
      throw new BadRequestException("Upload a nonempty file of at most 5 MB.");
    const b = f.buffer;
    const mime =
      b.subarray(0, 4).toString() === "%PDF"
        ? "application/pdf"
        : b
              .subarray(0, 8)
              .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
          ? "image/png"
          : b[0] === 255 && b[1] === 216 && b[2] === 255
            ? "image/jpeg"
            : b.subarray(0, 4).toString() === "RIFF" &&
                b.subarray(8, 12).toString() === "WEBP"
              ? "image/webp"
              : null;
    if (!mime || mime !== f.mimetype)
      throw new BadRequestException(
        "Only valid PDF, PNG, JPEG and WebP files are accepted.",
      );
    return mime;
  }
  async store(
    f: Express.Multer.File,
    ownerId: string | null,
    isPublic = false,
    applicationId?: string,
  ) {
    const mime = this.validate(f);
    if (isPublic && !mime.startsWith("image/"))
      throw new BadRequestException("Public uploads must be images.");
    const path = randomUUID();
    await mkdir(this.root(), { recursive: true });
    await writeFile(resolve(this.root(), path), f.buffer, { flag: "wx" });
    try {
      const file = await this.db.storedFile.create({
        data: {
          ownerId,
          applicationId,
          path,
          mime,
          size: f.size,
          filename:
            basename(f.originalname)
              .replace(/[^a-zA-Z0-9._ -]/g, "_")
              .slice(0, 150) || "document",
          public: isPublic,
        },
      });
      return {
        id: file.id,
        filename: file.filename,
        mime: file.mime,
        size: file.size,
        url: `/api/v1/uploads/${file.id}`,
      };
    } catch (e) {
      await unlink(resolve(this.root(), path));
      throw e;
    }
  }
  async download(a: Actor | undefined, id: string) {
    const f = found(
      await this.db.storedFile.findUnique({
        where: { id },
        include: {
          evidence: { include: { dispute: { include: { booking: true } } } },
        },
      }),
    );
    const d = f.evidence?.dispute;
    if (
      !f.public &&
      !(
        a &&
        (a.id === f.ownerId ||
          a.role === "ADMIN" ||
          (d &&
            (d.arbitratorId === a.id ||
              d.booking.customerId === a.id ||
              d.booking.providerId === a.id)))
      )
    )
      throw new ForbiddenException("File access denied.");
    return { file: f, buffer: await readFile(resolve(this.root(), f.path)) };
  }
}
