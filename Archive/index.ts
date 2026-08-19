import { logger } from "@vestfoldfylke/loglady";
import { ARCHIVE_ROLE } from "../config.js";
import callArchive from "../lib/call-archive.js";
import callArchiveTemplate from "../lib/call-archive-template.js";
import { decodeAccessToken } from "../lib/decode-access-token.js";
import { httpResponse } from "../lib/http-response.js";
import type { DecodedAccess, LegacyContext, LegacyRequest, LegacyResponse } from "../types/functions-v3.js";

export default async (context: LegacyContext, req: LegacyRequest): Promise<LegacyResponse | undefined> => {
  logger.logConfig({
    prefix: "Archive"
  });
  // Verify token
  const decoded: DecodedAccess = decodeAccessToken(req.headers.authorization) as DecodedAccess;

  if (!decoded.verified) {
    logger.warn(`Token is not valid - ${decoded.msg}`);
    return httpResponse(401, decoded.msg);
  }

  logger.info("Validating role");
  if (!decoded.roles.includes(ARCHIVE_ROLE)) {
    logger.info("Missing required role for access");
    return httpResponse(403, "Missing required role for access");
  }

  logger.logConfig({
    prefix: `Archive - clientId ${decoded.appid}${decoded.upn ? ` - ${decoded.upn}` : ""}`
  });

  logger.info("Role validated");

  // Input validation
  if (!req.body) {
    const msg = "Please pass a request body";
    logger.error(msg);
    return httpResponse(400, msg);
  }

  const { service, method, system, template, parameter, demoRun, getExample, options } = req.body;
  if (!parameter) {
    const msg = 'Missing required parameter "parameter"';
    logger.error(msg);
    return httpResponse(400, msg);
  }
  // Either (service and method) or (system and template) is required
  if (!(service && method) && !(system && template)) {
    const msg = 'Missing required parameter combination ("service" and "method") or ("system" and "template")';
    logger.error(msg);
    return httpResponse(400, msg);
  }

  // Validate that parameter is valid json
  try {
    JSON.parse(JSON.stringify(parameter));
  } catch (_error) {
    const msg = 'Parameter "parameter" must be valid json!';
    logger.error(msg);
    return httpResponse(400, msg);
  }
  // Validate that options is valid json if exists
  try {
    if (options) JSON.parse(JSON.stringify(options));
  } catch (_error) {
    const msg = 'Parameter "options" must be valid json!';
    logger.error(msg);
    return httpResponse(400, msg);
  }

  // Finished validation - we have valid role, either service, method, or system and template
  logger.logConfig({
    prefix: `Archive - clientId ${decoded.appid}${decoded.upn ? ` - ${decoded.upn}` : ""} - ${service || system} - ${method || template}`
  });

  // Raw call
  if (service && method) {
    try {
      const archiveResult = await callArchive(
        { service: service as string, method: method as string, parameter: parameter as Record<string, unknown>, options: options as Record<string, unknown> | undefined },
        context
      );
      return httpResponse(200, archiveResult);
    } catch (error) {
      const err = error as { response?: { data?: unknown }; stack?: string; toString: () => string };
      logger.error(`Raw archive call failed - ${err.response?.data || err.stack || err.toString()}`);
      return httpResponse(500, err); // 500 is fallback status code
    }
  }

  //  Template call
  if (system && template) {
    try {
      const templateResult = await callArchiveTemplate({ system, template, parameter, getExample, demoRun }, context);
      return httpResponse(200, templateResult);
    } catch (error) {
      const err = error as { response?: { data?: unknown }; stack?: string; toString: () => string };
      logger.error(`Template archive call failed - ${err.response?.data || err.stack || err.toString()}`);
      return httpResponse(500, err);
    }
  }
};
