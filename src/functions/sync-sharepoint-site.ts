import { app, type HttpRequest, type HttpResponseInit, type InvocationContext } from "@azure/functions";
import { logger } from "@vestfoldfylke/loglady";
import { ARCHIVE_ROLE } from "../../config.js";
import syncSharePointSite from "../../lib/archive/sync-sharepoint-site.js";
import { decodeAccessToken } from "../../lib/decode-access-token.js";
import HTTPError from "../../lib/http-error.js";
import { httpResponse } from "../../lib/http-response.js";

type SharePointBody = {
  siteUrl?: unknown;
  projectTitle?: unknown;
  responsiblePersonEmail?: unknown;
  projectNumber?: unknown;
  caseExternalId?: unknown;
  caseTitle?: unknown;
  accessGroup?: unknown;
  paragraph?: unknown;
  caseType?: unknown;
};

const validateInput = (body: SharePointBody): void => {
  const { siteUrl, projectTitle, responsiblePersonEmail, caseExternalId, caseTitle } = body;
  if (!siteUrl) throw new HTTPError(400, 'Missing required parameter "siteUrl"');
  if (typeof siteUrl !== "string") throw new HTTPError(400, '"siteUrl" must be string');
  if (!caseTitle) throw new HTTPError(400, 'Missing required parameter "caseTitle"');
  if (typeof caseTitle !== "string") throw new HTTPError(400, '"caseTitle" must be string');
  if (!projectTitle) throw new HTTPError(400, 'Missing required parameter "projectTitle"');
  if (typeof projectTitle !== "string") throw new HTTPError(400, '"projectTitle" must be string');
  if (!responsiblePersonEmail) throw new HTTPError(400, 'Missing required parameter "responsiblePersonEmail"');
  if (typeof responsiblePersonEmail !== "string") throw new HTTPError(400, '"responsiblePersonEmail" must be string');
  if (!caseExternalId) throw new HTTPError(400, 'Missing required parameter "caseExternalId"');
  if (typeof caseExternalId !== "string") throw new HTTPError(400, '"caseExternalId" must be string');
};

const syncSharepointSiteHandler = async (request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> => {
  logger.logConfig({ prefix: "SyncSharepointSite", contextId: context.invocationId });

  const decoded = decodeAccessToken(request.headers.get("authorization")) as { verified: boolean; msg: string | null; roles: string[]; appid?: string; upn?: string };

  if (!decoded.verified) {
    logger.warn(`Token is not valid - ${decoded.msg}`);
    return httpResponse(401, decoded.msg ?? "Token is not valid");
  }

  logger.info("Validating role");
  if (!decoded.roles.includes(ARCHIVE_ROLE)) {
    logger.info("Missing required role for access");
    return httpResponse(403, "Missing required role for access");
  }

  logger.logConfig({ prefix: `SyncSharepointSite - clientId ${decoded.appid}${decoded.upn ? ` - ${decoded.upn}` : ""}`, contextId: context.invocationId });
  logger.info("Role validated");

  let body: SharePointBody;
  try {
    body = (await request.json()) as SharePointBody;
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

  const { siteUrl, projectTitle, responsiblePersonEmail, projectNumber, caseExternalId, caseTitle, accessGroup, paragraph, caseType } = body;
  try {
    validateInput(body);
  } catch (error) {
    const err = error as HTTPError;
    return httpResponse(err.statusCode ?? 500, err);
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
    logger.info(`Trying to sync SharePointSite: SiteUrl: ${siteUrl as string}`);
    const result = await syncSharePointSite(input, context);
    logger.info(`Succesfully synced SharePointSite. SiteUrl: ${siteUrl as string}`);
    return httpResponse(200, result);
  } catch (error) {
    const err = error as { stack?: string; toString: () => string };
    logger.error(`error when syncing SharePointSite - ${err.stack || err.toString()}`);
    return httpResponse(500, err as Error);
  }
};

app.http("SyncSharepointSite", {
  authLevel: "anonymous",
  methods: ["POST"],
  handler: syncSharepointSiteHandler
});
