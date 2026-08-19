const { logger } = require("@vestfoldfylke/loglady");
const { ARCHIVE_ROLE } = require("../config.js");
const { httpResponse } = require("../lib/http-response.js");
const { decodeAccessToken } = require("../lib/decode-access-token.js");
const { getBrregData } = require("../lib/get-brreg-data.js");
const { repackBrreg } = require("../lib/repack-brreg-result.js");
const { syncEnterprise } = require("../lib/archive/sync-enterprise.js");

module.exports = async (context, req) => {
  logger.logConfig({
    prefix: "SyncEnterprise"
  });
  // Verify token
  const decoded = decodeAccessToken(req.headers.authorization);

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
    prefix: `SyncEnterprise - clientId ${decoded.appid}${decoded.upn ? ` - ${decoded.upn}` : ""}`
  });

  logger.info("Role validated");

  // Input validation
  if (!req.body) {
    const msg = "Please pass a request body";
    logger.error(msg);
    return httpResponse(400, msg);
  }

  // Below, we see valid input properties in body
  const { orgnr } = req.body;
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
    logger.error(`error when syncing enterprise - ${error.response?.data || error.stack || error.toString()}`);
    return httpResponse(500, error);
  }
};
