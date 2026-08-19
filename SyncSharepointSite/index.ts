import { logger } from "@vestfoldfylke/loglady";
import { ARCHIVE_ROLE } from "../config.js";
import syncSharePointSite from "../lib/archive/sync-sharepoint-site.js";
import { decodeAccessToken } from "../lib/decode-access-token.js";
import HTTPError from "../lib/http-error.js";
import { httpResponse } from "../lib/http-response.js";
import type { DecodedAccess, LegacyContext, LegacyRequest, LegacyResponse } from "../types/functions-v3.js";

const validateInput = (body) => {
  const { siteUrl, projectTitle, responsiblePersonEmail, caseExternalId, caseTitle } = body;
  if (!siteUrl) {
    throw new HTTPError(400, 'Missing required parameter "siteUrl"');
  }
  if (typeof siteUrl !== "string") {
    throw new HTTPError(400, '"siteUrl" must be string');
  }
  if (!caseTitle) {
    throw new HTTPError(400, 'Missing required parameter "caseTitle"');
  }
  if (typeof caseTitle !== "string") {
    throw new HTTPError(400, '"caseTitle" must be string');
  }
  if (!projectTitle) {
    throw new HTTPError(400, 'Missing required parameter "projectTitle"');
  }
  if (typeof projectTitle !== "string") {
    throw new HTTPError(400, '"projectTitle" must be string');
  }
  if (!responsiblePersonEmail) {
    throw new HTTPError(400, 'Missing required parameter "responsiblePersonEmail"');
  }
  if (typeof responsiblePersonEmail !== "string") {
    throw new HTTPError(400, '"responsiblePersonEmail" must be string');
  }
  if (!caseExternalId) {
    throw new HTTPError(400, 'Missing required parameter "caseExternalId"');
  }
  if (typeof caseExternalId !== "string") {
    throw new HTTPError(400, '"caseExternalId" must be string');
  }
};

export default async (context: LegacyContext, req: LegacyRequest): Promise<LegacyResponse | undefined> => {
  logger.logConfig({
    prefix: "SyncSharepointSite"
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
    prefix: `SyncSharepointSite - clientId ${decoded.appid}${decoded.upn ? ` - ${decoded.upn}` : ""}`
  });

  logger.info("Role validated");

  // Input validation
  if (!req.body) {
    const msg = "Please pass a request body";
    logger.error(msg);
    return httpResponse(400, msg);
  }

  // Below, we see valid input properties in body
  const { siteUrl, projectTitle, responsiblePersonEmail, projectNumber, caseExternalId, caseTitle, accessGroup, paragraph, caseType } = req.body;
  try {
    validateInput(req.body);
  } catch (error) {
    const err = error as { response?: { data?: unknown }; stack?: string; toString: () => string };
    return httpResponse(500, err);
  }
  const input = {
    siteUrl,
    projectTitle,
    responsiblePersonEmail,
    projectNumber,
    caseExternalId,
    caseTitle,
    accessGroup,
    paragraph,
    caseType
  };
  try {
    logger.info(`Trying to sync SharePointSite: SiteUrl: ${siteUrl}`);
    const result = await syncSharePointSite(input, context);
    logger.info(`Succesfully synced SharePointSite. SiteUrl: ${siteUrl}`);
    return httpResponse(200, result);
  } catch (error) {
    const err = error as { response?: { data?: unknown }; stack?: string; toString: () => string };
    logger.error(`error when syncing SharePointSite - ${err.response?.data || err.stack || err.toString()}`);
    return httpResponse(500, err);
  }
};
