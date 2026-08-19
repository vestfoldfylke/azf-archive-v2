import { logger } from "@vestfoldfylke/loglady";
import { ARCHIVE_ROLE } from "../config.js";
import { syncEmployee } from "../lib/archive/sync-employee.js";
import { getSyncPrivatePersonMethod, syncPrivatePerson } from "../lib/archive/sync-private-person.js";
import { decodeAccessToken } from "../lib/decode-access-token.js";
import { callFintfolk } from "../lib/fintfolk.js";
import { httpResponse } from "../lib/http-response.js";
import type { DecodedAccess, LegacyContext, LegacyRequest, LegacyResponse } from "../types/functions-v3.js";

export default async (context: LegacyContext, req: LegacyRequest): Promise<LegacyResponse | undefined> => {
  logger.logConfig({
    prefix: "SyncEmployee"
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
    prefix: `SyncEmployee - clientId ${decoded.appid}${decoded.upn ? ` - ${decoded.upn}` : ""}`
  });

  logger.info("Role validated");

  // Input validation
  if (!req.body) {
    const msg = "Please pass a request body";
    logger.error(msg);
    return httpResponse(400, msg);
  }

  // Below, we see valid input properties in body
  const { ssn, ansattnummer, upn, forceUpdate, manualManagerEmail } = req.body;

  if (!ssn && !ansattnummer && !upn) {
    logger.info('Missing required parameter "ssn" or "ansattnummer" or "upn"');
    return httpResponse(400, 'Missing required parameter "ssn" or "ansattnummer" or "upn"');
  }

  // Get FINTFOLK DATA
  let resourceUrl;
  if (ansattnummer) {
    resourceUrl = `employee/ansattnummer/${ansattnummer}`;
  } else if (ssn) {
    resourceUrl = `employee/fodselsnummer/${ssn}`;
  } else if (upn) {
    resourceUrl = `employee/upn/${upn}`;
  } else {
    logger.info('WHAAT hit should we not arrive... Missing required parameter "ssn" or "ansattnummer" or "upn"');
    return httpResponse(400, 'WHAAT hit should we not arrive... Missing required parameter "ssn" or "ansattnummer" or "upn"');
  }

  let fintfolkEmployee;
  try {
    logger.info("Calling fintfolk");
    fintfolkEmployee = await callFintfolk(resourceUrl);
    logger.info("Succesfully got response from fintfolk");
  } catch (error) {
    const err = error as { response?: { data?: unknown }; stack?: string; toString: () => string };
    logger.error(`error when calling fintfolk - ${err.response?.data || err.stack || err.toString()}`);
    return httpResponse(500, err);
  }

  const syncPrivatePersonData = {
    ssn: fintfolkEmployee.fodselsnummer,
    forceUpdate
  };

  let privatePerson;
  try {
    logger.info("Syncing PrivatePerson");
    getSyncPrivatePersonMethod(syncPrivatePersonData); // Throws error if we do not have a valid combination of parameters
    privatePerson = await syncPrivatePerson(syncPrivatePersonData, context);
    logger.info("Succesfully synced PrivatePerson");
  } catch (error) {
    const err = error as { response?: { data?: unknown }; stack?: string; toString: () => string };
    logger.error(`error when syncing privatePerson - ${err.response?.data || err.stack || err.toString()}`);
    return httpResponse(500, err);
  }

  try {
    logger.info("Syncing employee");
    const { responsibleEnterprise, archiveManager } = await syncEmployee(privatePerson, fintfolkEmployee, manualManagerEmail, context);
    logger.info("Succesfully synced employee");
    return httpResponse(200, { privatePerson, archiveManager, responsibleEnterprise });
  } catch (error) {
    const err = error as { response?: { data?: unknown }; stack?: string; toString: () => string };
    logger.error(`error when syncing employee - ${err.response?.data || err.stack || err.toString()}`);
    return httpResponse(500, err);
  }
};
