import { app, type HttpRequest, type HttpResponseInit, type InvocationContext } from "@azure/functions";
import { logger } from "@vestfoldfylke/loglady";
import callArchive from "../../lib/call-archive.js";
import callArchiveTemplate from "../../lib/call-archive-template.js";
import HTTPError from "../../lib/http-error.js";
import { httpResponse } from "../../lib/http-response.js";
import { validateAndGetToken } from "../../lib/validate-and-get-token.js";
import type { CallArchiveInput, CallArchiveTemplateInput } from "../../types/archive.js";
import { updateContext } from "../middleware/async-local-context.js";
import { logContextHandling } from "../middleware/logcontext-handling.js";

type ArchiveBody = CallArchiveInput & CallArchiveTemplateInput;

const archiveHandler = async (request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> => {
  let logPrefix: string = "Archive";

  updateContext({ prefix: logPrefix, contextId: context.invocationId });

  const { decoded, errorResponse } = validateAndGetToken(request.headers.get("authorization"));
  if (errorResponse) {
    return errorResponse;
  }

  logPrefix = `Archive - clientId ${decoded.appid}${decoded.upn ? ` - ${decoded.upn}` : ""}`;
  updateContext({ prefix: logPrefix, contextId: context.invocationId });
  logger.info("Role validated");

  let body: ArchiveBody;
  try {
    body = (await request.json()) as ArchiveBody;
  } catch (error) {
    const msg = "Please pass a valid request body";
    logger.errorException(error, msg);
    return httpResponse(400, msg);
  }
  if (!body) {
    const msg = "Please pass a request body";
    logger.error(msg);
    return httpResponse(400, msg);
  }

  const { service, method, system, template, parameter, demoRun, getExample, options } = body;
  if (!parameter) {
    const msg = 'Missing required parameter "parameter"';
    logger.error(msg);
    return httpResponse(400, msg);
  }
  if (!(service && method) && !(system && template)) {
    const msg = 'Missing required parameter combination ("service" and "method") or ("system" and "template")';
    logger.error(msg);
    return httpResponse(400, msg);
  }

  if (options) {
    try {
      JSON.parse(JSON.stringify(options));
    } catch (error) {
      const msg = 'Parameter "options" must be valid json!';
      logger.errorException(error, msg);
      return httpResponse(400, msg);
    }
  }

  logPrefix += ` - ${service || system} - ${method || template}`;
  updateContext({ prefix: logPrefix, contextId: context.invocationId });

  if (service && method) {
    try {
      const archiveResult = await callArchive({ service, method, parameter, options });
      return httpResponse(200, archiveResult);
    } catch (error) {
      if (error instanceof HTTPError) {
        logger.errorException(error, "Raw archive call failed - Status: {Status} - Data: {@Data}", error.statusCode, error.data as object);
        return httpResponse(500, error);
      }

      logger.errorException(error, "Raw archive call failed");
      return httpResponse(500, error);
    }
  }

  if (system && template) {
    try {
      const templateResult = await callArchiveTemplate({ system, template, parameter, getExample, demoRun });
      return httpResponse(200, templateResult);
    } catch (error) {
      if (error instanceof HTTPError) {
        logger.errorException(error, "Template archive call failed - Status: {Status} - {@Data}", error.statusCode, error.data as object);
        return httpResponse(error.statusCode, error);
      }

      logger.errorException(error, "Template archive call failed");
      return httpResponse(500, error);
    }
  }

  return httpResponse(400, "Unreachable: no branch matched");
};

app.http("Archive", {
  authLevel: "anonymous",
  methods: ["POST"],
  route: "archive",
  handler: async (request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> => await logContextHandling(request, context, archiveHandler)
});
