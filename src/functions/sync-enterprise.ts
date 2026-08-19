import { app, type HttpRequest, type HttpResponseInit, type InvocationContext } from "@azure/functions";
import { logger } from "@vestfoldfylke/loglady";
import { ARCHIVE_ROLE } from "../../config.js";
import { syncEnterprise } from "../../lib/archive/sync-enterprise.js";
import { decodeAccessToken } from "../../lib/decode-access-token.js";
import { getBrregData } from "../../lib/get-brreg-data.js";
import { httpResponse } from "../../lib/http-response.js";
import { repackBrreg } from "../../lib/repack-brreg-result.js";

const syncEnterpriseHandler = async (request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> => {
  logger.logConfig({ prefix: "SyncEnterprise", contextId: context.invocationId });

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

  logger.logConfig({ prefix: `SyncEnterprise - clientId ${decoded.appid}${decoded.upn ? ` - ${decoded.upn}` : ""}`, contextId: context.invocationId });
  logger.info("Role validated");

  let body: { orgnr?: string };
  try {
    body = (await request.json()) as { orgnr?: string };
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

  const { orgnr } = body;
  if (!orgnr) {
    const msg = 'Missing required parameter "orgnr"';
    logger.error(msg);
    return httpResponse(400, msg);
  }

  try {
    logger.info(`Fetching brregdata for orgnr: ${orgnr}`);
    const brregEnterprise = await getBrregData(orgnr, context);
    logger.info(`Got brregdata for orgnr: ${orgnr}, repacking result`);
    const repackedEnterprise = repackBrreg(brregEnterprise);
    logger.info(`Syncing enterprise orgnr: ${orgnr} in archive`);
    const enterprise = await syncEnterprise(repackedEnterprise, context);
    logger.info(`Successfully synced enterprise orgnr: ${orgnr} in archive`);
    return httpResponse(200, { repackedEnterprise, enterprise });
  } catch (error) {
    const err = error as { stack?: string; toString: () => string };
    logger.error(`error when syncing enterprise - ${err.stack || err.toString()}`);
    return httpResponse(500, err as Error);
  }
};

app.http("SyncEnterprise", {
  authLevel: "anonymous",
  methods: ["POST"],
  handler: syncEnterpriseHandler
});
