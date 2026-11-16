import { INestApplication, ValidationPipe } from "@nestjs/common";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { ApiErrors } from "./common/errors";
export function configure(app: INestApplication) {
  const origins = (process.env.CORS_ORIGIN || "http://localhost:5173")
    .split(",")
    .map((s) => s.trim());
  app.setGlobalPrefix("api/v1");
  app.use(helmet());
  app.use(cookieParser());
  app.enableCors({ origin: origins, credentials: true });
  app.use((req: any, res: any, next: any) => {
    if (
      !["GET", "HEAD", "OPTIONS"].includes(req.method) &&
      req.headers.origin &&
      !origins.includes(req.headers.origin)
    )
      return res
        .status(403)
        .json({ statusCode: 403, message: "Origin not allowed." });
    next();
  });
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );
  app.useGlobalFilters(new ApiErrors());
  app.enableShutdownHooks();
  SwaggerModule.setup(
    "api/docs",
    app,
    SwaggerModule.createDocument(
      app,
      new DocumentBuilder()
        .setTitle("ServiceHub API")
        .setDescription(
          "Persistent marketplace API. All financial transactions are simulated.",
        )
        .setVersion("1")
        .addBearerAuth()
        .addSecurityRequirements("bearer")
        .build(),
    ),
  );
}
export function validateConfig() {
  if (
    !process.env.DATABASE_URL?.startsWith("postgresql://") &&
    !process.env.DATABASE_URL?.startsWith("postgres://")
  )
    throw new Error("DATABASE_URL must be a PostgreSQL connection URL.");
  if (
    !process.env.JWT_SECRET ||
    process.env.JWT_SECRET.length < 32 ||
    process.env.JWT_SECRET.startsWith("replace-")
  )
    throw new Error("Set JWT_SECRET to at least 32 random characters.");
  if (
    process.env.NODE_ENV === "production" &&
    process.env.DEMO_ENABLED === "true"
  )
    throw new Error("DEMO_ENABLED must be false in production.");
}
