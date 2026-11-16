import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
} from "@nestjs/common";
@Catch()
export class ApiErrors implements ExceptionFilter {
  catch(error: any, host: ArgumentsHost) {
    const status =
      error instanceof HttpException
        ? error.getStatus()
        : ["P2002", "P2034"].includes(error.code)
          ? 409
          : error.code === "P2003" ? 400
          : error.code === "P2025"
            ? 404
            : 500;
    const response =
      error instanceof HttpException ? error.getResponse() : null;
    host
      .switchToHttp()
      .getResponse()
      .status(status)
      .json({
        statusCode: status,
        error:
          status === 500
            ? "Internal Server Error"
            : error.name || "RequestError",
        message:
          response && typeof response === "object"
            ? (response as any).message
            : response ||
              (status === 409
                ? "Conflicting or duplicate record."
                : status === 404
                  ? "Record not found."
                  : status === 400 ? "Invalid related record." : "Unable to process the request."),
      });
  }
}
