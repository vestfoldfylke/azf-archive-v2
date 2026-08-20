import { app, type HttpRequest, type HttpResponseInit, type InvocationContext } from "@azure/functions";
import { logger } from "@vestfoldfylke/loglady";
import { syncEnterprise } from "../../lib/archive/sync-enterprise.js";
import { getBrregData } from "../../lib/get-brreg-data.js";
import HTTPError from "../../lib/http-error.js";
import { httpResponse } from "../../lib/http-response.js";
import { repackBrreg } from "../../lib/repack-brreg-result.js";
import { validateAndGetToken } from "../../lib/validate-and-get-token.js";
import { updateContext } from "../middleware/async-local-context.js";
import { logContextHandling } from "../middleware/logcontext-handling.js";

const syncEnterpriseHandler = async (request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> => {
  updateContext({ prefix: "SyncEnterprise", contextId: context.invocationId });

  const { decoded, errorResponse } = validateAndGetToken(request.headers.get("authorization"));
  if (errorResponse) {
    return errorResponse;
  }

  updateContext({ prefix: `SyncEnterprise - clientId ${decoded.appid}${decoded.upn ? ` - ${decoded.upn}` : ""}`, contextId: context.invocationId });
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
    logger.info("Fetching brregdata for orgnr: {Orgnr}", orgnr);
    const brregEnterprise = await getBrregData(orgnr, context);
    logger.info("Got brregdata for orgnr: {Orgnr}, repacking result", orgnr);

    const repackedEnterprise = repackBrreg(brregEnterprise);
    logger.info("Syncing enterprise orgnr: {Orgnr} in archive", orgnr);
    const enterprise = await syncEnterprise(repackedEnterprise, context);
    logger.info("Successfully synced enterprise orgnr: {Orgnr} in archive", orgnr);

    return httpResponse(200, { repackedEnterprise, enterprise });
  } catch (error) {
    if (error instanceof HTTPError) {
      logger.errorException(error, "Error when syncing enterprise - Status: {Status} - Data: {@Data}", error.statusCode, error.data as object);
      return httpResponse(error.statusCode, error);
    }

    logger.errorException(error, "Error when syncing enterprise");
    return httpResponse(500, error);
  }
};

app.http("SyncEnterprise", {
  authLevel: "anonymous",
  methods: ["POST"],
  handler: async (request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> => await logContextHandling(request, context, syncEnterpriseHandler)
});
