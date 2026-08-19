import { app, type HttpRequest, type HttpResponseInit, type InvocationContext } from "@azure/functions";
import { logger } from "@vestfoldfylke/loglady";
import { ARCHIVE_ROLE } from "../../config.js";
import { syncEmployee } from "../../lib/archive/sync-employee.js";
import { getSyncPrivatePersonMethod, syncPrivatePerson } from "../../lib/archive/sync-private-person.js";
import { decodeAccessToken } from "../../lib/decode-access-token.js";
import { callFintfolk } from "../../lib/fintfolk.js";
import { httpResponse } from "../../lib/http-response.js";

const syncEmployeeHandler = async (request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> => {
  logger.logConfig({ prefix: "SyncEmployee", contextId: context.invocationId });

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

  logger.logConfig({ prefix: `SyncEmployee - clientId ${decoded.appid}${decoded.upn ? ` - ${decoded.upn}` : ""}`, contextId: context.invocationId });
  logger.info("Role validated");

  let body: { ssn?: string; ansattnummer?: string; upn?: string; forceUpdate?: boolean; manualManagerEmail?: string };
  try {
    body = (await request.json()) as typeof body;
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

  const { ssn, ansattnummer, upn, forceUpdate, manualManagerEmail } = body;

  if (!ssn && !ansattnummer && !upn) {
    logger.info('Missing required parameter "ssn" or "ansattnummer" or "upn"');
    return httpResponse(400, 'Missing required parameter "ssn" or "ansattnummer" or "upn"');
  }

  let resourceUrl: string;
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

  let fintfolkEmployee: { fodselsnummer?: string; [key: string]: unknown };
  try {
    logger.info("Calling fintfolk");
    fintfolkEmployee = (await callFintfolk(resourceUrl)) as typeof fintfolkEmployee;
    logger.info("Succesfully got response from fintfolk");
  } catch (error) {
    const err = error as { stack?: string; toString: () => string };
    logger.error(`error when calling fintfolk - ${err.stack || err.toString()}`);
    return httpResponse(500, err as Error);
  }

  const syncPrivatePersonData = {
    ssn: fintfolkEmployee.fodselsnummer,
    forceUpdate
  };

  let privatePerson;
  try {
    logger.info("Syncing PrivatePerson");
    getSyncPrivatePersonMethod(syncPrivatePersonData);
    privatePerson = await syncPrivatePerson(syncPrivatePersonData, context);
    logger.info("Succesfully synced PrivatePerson");
  } catch (error) {
    const err = error as { stack?: string; toString: () => string };
    logger.error(`error when syncing privatePerson - ${err.stack || err.toString()}`);
    return httpResponse(500, err as Error);
  }

  try {
    logger.info("Syncing employee");
    const { responsibleEnterprise, archiveManager } = await syncEmployee(privatePerson, fintfolkEmployee, manualManagerEmail, context);
    logger.info("Succesfully synced employee");
    return httpResponse(200, { privatePerson, archiveManager, responsibleEnterprise });
  } catch (error) {
    const err = error as { stack?: string; toString: () => string };
    logger.error(`error when syncing employee - ${err.stack || err.toString()}`);
    return httpResponse(500, err as Error);
  }
};

app.http("SyncEmployee", {
  authLevel: "anonymous",
  methods: ["POST"],
  handler: syncEmployeeHandler
});
