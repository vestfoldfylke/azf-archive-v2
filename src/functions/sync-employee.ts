import { app, type HttpRequest, type HttpResponseInit, type InvocationContext } from "@azure/functions";
import { logger } from "@vestfoldfylke/loglady";
import { syncEmployee } from "../../lib/archive/sync-employee.js";
import { getSyncPrivatePersonMethod, syncPrivatePerson } from "../../lib/archive/sync-private-person.js";
import { callFintfolk } from "../../lib/fintfolk.js";
import HTTPError from "../../lib/http-error.js";
import { httpResponse } from "../../lib/http-response.js";
import { validateAndGetToken } from "../../lib/validate-and-get-token.js";
import { updateContext } from "../middleware/async-local-context.js";
import { logContextHandling } from "../middleware/logcontext-handling.js";

const syncEmployeeHandler = async (request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> => {
  updateContext({ prefix: "SyncEmployee", contextId: context.invocationId });

  const { decoded, errorResponse } = validateAndGetToken(request.headers.get("authorization"));
  if (errorResponse) {
    return errorResponse;
  }

  updateContext({ prefix: `SyncEmployee - clientId ${decoded.appid}${decoded.upn ? ` - ${decoded.upn}` : ""}`, contextId: context.invocationId });
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
    logger.info("Successfully got response from fintfolk");
  } catch (error) {
    if (error instanceof HTTPError) {
      logger.errorException(error, "Error when calling FINTFolk - Status: {Status} - Data: {@Data}", error.statusCode, error.data as object);
      return httpResponse(error.statusCode, error);
    }

    logger.errorException(error, "Error when calling FINTFolk");
    return httpResponse(500, error);
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
    logger.info("Successfully synced PrivatePerson");
  } catch (error) {
    if (error instanceof HTTPError) {
      logger.errorException(error, "Error when syncing privatePerson - Status: {Status} - Data: {@Data}", error.statusCode, error.data as object);
      return httpResponse(error.statusCode, error);
    }

    logger.errorException(error, "Error when syncing privatePerson");
    return httpResponse(500, error);
  }

  try {
    logger.info("Syncing employee");
    const { responsibleEnterprise, archiveManager } = await syncEmployee(privatePerson, fintfolkEmployee, manualManagerEmail, context);
    logger.info("Successfully synced employee");
    return httpResponse(200, { privatePerson, archiveManager, responsibleEnterprise });
  } catch (error) {
    if (error instanceof HTTPError) {
      logger.errorException(error, "Error when syncing employee - Status: {Status} - Data: {@Data}", error.statusCode, error.data as object);
      return httpResponse(error.statusCode, error);
    }

    logger.errorException(error, "Error when syncing employee");
    return httpResponse(500, error);
  }
};

app.http("SyncEmployee", {
  authLevel: "anonymous",
  methods: ["POST"],
  handler: async (request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> => await logContextHandling(request, context, syncEmployeeHandler)
});
