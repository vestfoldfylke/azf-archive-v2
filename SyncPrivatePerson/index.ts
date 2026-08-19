import { logger } from "@vestfoldfylke/loglady";
import { ARCHIVE_ROLE } from "../config.js";
import { getName, getSyncPrivatePersonMethod, syncPrivatePerson } from "../lib/archive/sync-private-person.js";
import { decodeAccessToken } from "../lib/decode-access-token.js";
import { httpResponse } from "../lib/http-response.js";
import type { DecodedAccess, LegacyContext, LegacyRequest, LegacyResponse } from "../types/functions-v3.js";

export default async (context: LegacyContext, req: LegacyRequest): Promise<LegacyResponse | undefined> => {
  logger.logConfig({
    prefix: "SyncPrivatePerson"
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
    prefix: `SyncPrivatePerson - clientId ${decoded.appid}${decoded.upn ? ` - ${decoded.upn}` : ""}`
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
    return httpResponse(200, { privatePerson });
  } catch (error) {
    const err = error as { response?: { data?: unknown }; stack?: string; toString: () => string };
    logger.error(`error when syncing privatePerson - ${err.response?.data || err.stack || err.toString()}`);
    return httpResponse(500, err);
  }
};
