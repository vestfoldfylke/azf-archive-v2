const { logger } = require("@vestfoldfylke/loglady");
const { ARCHIVE_ROLE } = require("../config.js");
const { httpResponse } = require("../lib/http-response.js");
const { decodeAccessToken } = require("../lib/decode-access-token.js");
const { syncPrivatePerson, getSyncPrivatePersonMethod, getName } = require("../lib/archive/sync-private-person.js");
const { syncElevmappe } = require("../lib/archive/sync-elevmappe.js");

module.exports = async (context, req) => {
  logger.logConfig({
    prefix: "SyncElevmappe"
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
    prefix: `SyncElevmappe - clientId ${decoded.appid}${decoded.upn ? ` - ${decoded.upn}` : ""}`
  });

  logger.info("Role validated");

  // Input validation
  if (!req.body) {
    const msg = "Please pass a request body";
    logger.error(msg);
    return httpResponse(400, msg);
  }

  // Below, we see valid input properties in body
  const { ssn, name, firstName, lastName, birthdate, fakeSsn, gender, streetAddress, zipCode, zipPlace, email, phoneNumber, forceUpdate, manualData } = req.body;
  const nameObj = getName(name, firstName, lastName); // Name can be either "name" or "firstName and lastName", so we make sure it we have them all further on
  const syncPrivatePersonData = {
    ssn,
    name: nameObj.fullName,
    firstName: nameObj.firstName,
    lastName: nameObj.lastName,
    birthdate,
    fakeSsn,
    gender,
    streetAddress,
    zipCode,
    zipPlace,
    email,
    phoneNumber,
    forceUpdate,
    manualData
  };

  let privatePerson;
  try {
    logger.info("Syncing PrivatePerson");
    getSyncPrivatePersonMethod(syncPrivatePersonData); // Throws error if we do not have a valid combination of parameters
    privatePerson = await syncPrivatePerson(syncPrivatePersonData, context);
    logger.info("Succesfully synced PrivatePerson");
  } catch (error) {
    logger.error(`error when syncing privatePerson - ${error.response?.data || error.stack || error.toString()}`);
    return httpResponse(500, error);
  }

  try {
    logger.info("Syncing elevmappe");
    const elevmappe = await syncElevmappe(privatePerson, context);
    logger.info("Succesfully synced elevmappe");
    return httpResponse(200, { privatePerson, elevmappe });
  } catch (error) {
    logger.error(`error when syncing elevmappe - ${error.response?.data || error.stack || error.toString()}`);
    return httpResponse(500, error);
  }
};
