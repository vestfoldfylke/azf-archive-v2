import { app, type HttpRequest, type HttpResponseInit, type InvocationContext } from "@azure/functions";
import { logger } from "@vestfoldfylke/loglady";
import callArchive from "../../lib/call-archive.js";
import callArchiveTemplate from "../../lib/call-archive-template.js";
import { httpResponse } from "../../lib/http-response.js";
import { validateAndGetToken } from "../../lib/validate-and-get-token.js";
import { updateContext } from "../middleware/async-local-context.js";
import { logContextHandling } from "../middleware/logcontext-handling.js";

type ArchiveBody = {
  service?: string;
  method?: string;
  system?: string;
  template?: string;
  parameter?: Record<string, unknown>;
  demoRun?: boolean;
  getExample?: boolean;
  options?: Record<string, unknown>;
};

const archiveHandler = async (request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> => {
  updateContext({ prefix: "Archive", contextId: context.invocationId });

  const { decoded, errorResponse } = validateAndGetToken(request.headers.get("authorization"));
  if (errorResponse) {
    return errorResponse;
  }

  updateContext({ prefix: `Archive - clientId ${decoded.appid}${decoded.upn ? ` - ${decoded.upn}` : ""}`, contextId: context.invocationId });
  logger.info("Role validated");

  let body: ArchiveBody;
  try {
    body = (await request.json()) as ArchiveBody;
  } catch {
    const msg = "Please pass a request body";
    logger.error(msg);
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

  try {
    JSON.parse(JSON.stringify(parameter));
  } catch {
    const msg = 'Parameter "parameter" must be valid json!';
    logger.error(msg);
    return httpResponse(400, msg);
  }
  try {
    if (options) JSON.parse(JSON.stringify(options));
  } catch {
    const msg = 'Parameter "options" must be valid json!';
    logger.error(msg);
    return httpResponse(400, msg);
  }

  updateContext({
    prefix: `Archive - clientId ${decoded.appid}${decoded.upn ? ` - ${decoded.upn}` : ""} - ${service || system} - ${method || template}`,
    contextId: context.invocationId
  });

  if (service && method) {
    try {
      const archiveResult = await callArchive({ service, method, parameter, options }, context);
      return httpResponse(200, archiveResult);
    } catch (error) {
      const err = error as { stack?: string; toString: () => string };
      logger.error(`Raw archive call failed - ${err.stack || err.toString()}`);
      return httpResponse(500, err as Error);
    }
  }

  if (system && template) {
    try {
      const templateResult = await callArchiveTemplate({ system, template, parameter, getExample, demoRun }, context);
      return httpResponse(200, templateResult);
    } catch (error) {
      const err = error as { stack?: string; toString: () => string };
      logger.error(`Template archive call failed - ${err.stack || err.toString()}`);
      return httpResponse(500, err as Error);
    }
  }

  return httpResponse(400, "Unreachable: no branch matched");
};

app.http("Archive", {
  authLevel: "anonymous",
  methods: ["POST"],
  route: "archive",
  handler: async (request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> =>
    await logContextHandling(request, context, archiveHandler)
});
