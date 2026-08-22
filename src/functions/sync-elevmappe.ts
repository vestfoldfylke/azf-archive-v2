import { app, type HttpRequest, type HttpResponseInit, type InvocationContext } from "@azure/functions";
import { logger } from "@vestfoldfylke/loglady";
import { syncElevmappe } from "../../lib/archive/sync-elevmappe.js";
import { getName, getOrThrowSyncPrivatePersonMethod, syncPrivatePerson } from "../../lib/archive/sync-private-person.js";
import HTTPError from "../../lib/http-error.js";
import { httpResponse } from "../../lib/http-response.js";
import { validateAndGetToken } from "../../lib/validate-and-get-token.js";
import type { Name, SyncElevmappeBody, SyncPrivatePersonResponse } from "../../types/elevmappe.js";
import type { SIFRecnoAndCaseNumberResponse } from "../../types/sif.js";
import { updateContext } from "../middleware/async-local-context.js";
import { logContextHandling } from "../middleware/logcontext-handling.js";

const syncElevmappeHandler = async (request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> => {
  updateContext({ prefix: "SyncElevmappe", contextId: context.invocationId });

  const { decoded, errorResponse } = validateAndGetToken(request.headers.get("authorization"));
  if (errorResponse) {
    return errorResponse;
  }

  updateContext({ prefix: `SyncElevmappe - clientId ${decoded.appid}${decoded.upn ? ` - ${decoded.upn}` : ""}`, contextId: context.invocationId });
  logger.info("Role validated");

  let body: SyncElevmappeBody;
  try {
    body = (await request.json()) as SyncElevmappeBody;
  } catch (error) {
    const msg = "Please pass a request body";
    logger.errorException(error, msg);
    return httpResponse(400, msg);
  }
  if (!body) {
    const msg = "Please pass a request body";
    logger.error(msg);
    return httpResponse(400, msg);
  }

  const { ssn, name, firstName, lastName, birthdate, fakeSsn, gender, streetAddress, zipCode, zipPlace, email, phoneNumber, forceUpdate, manualData } = body as SyncElevmappeBody;
  const nameObj: Name = getName(name, firstName, lastName);

  const syncPrivatePersonData: SyncElevmappeBody = {
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

  let privatePerson: SyncPrivatePersonResponse;

  try {
    logger.info("Syncing PrivatePerson");
    getOrThrowSyncPrivatePersonMethod(syncPrivatePersonData);

    privatePerson = await syncPrivatePerson(syncPrivatePersonData);
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
    logger.info("Syncing elevmappe");

    const elevmappe: SIFRecnoAndCaseNumberResponse = await syncElevmappe(privatePerson);
    logger.info("Successfully synced elevmappe");
    return httpResponse(200, { privatePerson, elevmappe });
  } catch (error) {
    if (error instanceof HTTPError) {
      logger.errorException(error, "Error when syncing elevmappe - Status: {Status} - Data: {@Data}", error.statusCode, error.data as object);
      return httpResponse(error.statusCode, error);
    }

    logger.errorException(error, "Error when syncing elevmappe");
    return httpResponse(500, error);
  }
};

app.http("SyncElevmappe", {
  authLevel: "anonymous",
  methods: ["POST"],
  handler: async (request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> => await logContextHandling(request, context, syncElevmappeHandler)
});
