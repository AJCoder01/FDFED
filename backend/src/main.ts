import "reflect-metadata";
import "dotenv/config";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { configure, validateConfig } from "./bootstrap";
async function main() {
  validateConfig();
  const app = await NestFactory.create(AppModule);
  configure(app);
  await app.listen(Number(process.env.PORT) || 3000, "127.0.0.1");
}
main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
