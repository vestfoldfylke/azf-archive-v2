import { app, type HttpRequest, type HttpResponseInit, type InvocationContext } from "@azure/functions";
import { logger } from "@vestfoldfylke/loglady";
import { syncElevmappe } from "../../lib/archive/sync-elevmappe.js";
import { getName, getSyncPrivatePersonMethod, syncPrivatePerson } from "../../lib/archive/sync-private-person.js";
import { httpResponse } from "../../lib/http-response.js";
import { validateAndGetToken } from "../../lib/validate-and-get-token.js";

const syncElevmappeHandler = async (request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> => {
  logger.logConfig({ prefix: "SyncElevmappe", contextId: context.invocationId });

  const { decoded, errorResponse } = validateAndGetToken(request.headers.get("authorization"));
  if (errorResponse) {
    return errorResponse;
  }

  logger.logConfig({ prefix: `SyncElevmappe - clientId ${decoded.appid}${decoded.upn ? ` - ${decoded.upn}` : ""}`, contextId: context.invocationId });
  logger.info("Role validated");

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
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

  const { ssn, name, firstName, lastName, birthdate, fakeSsn, gender, streetAddress, zipCode, zipPlace, email, phoneNumber, forceUpdate, manualData } = body as Record<
    string,
    string | boolean | undefined
  >;
  const nameObj = getName(name, firstName, lastName);
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
    getSyncPrivatePersonMethod(syncPrivatePersonData);
    privatePerson = await syncPrivatePerson(syncPrivatePersonData, context);
    logger.info("Succesfully synced PrivatePerson");
  } catch (error) {
    const err = error as { stack?: string; toString: () => string };
    logger.error(`error when syncing privatePerson - ${err.stack || err.toString()}`);
    return httpResponse(500, err as Error);
  }

  try {
    logger.info("Syncing elevmappe");
    const elevmappe = await syncElevmappe(privatePerson, context);
    logger.info("Succesfully synced elevmappe");
    return httpResponse(200, { privatePerson, elevmappe });
  } catch (error) {
    const err = error as { stack?: string; toString: () => string };
    logger.error(`error when syncing elevmappe - ${err.stack || err.toString()}`);
    return httpResponse(500, err as Error);
  }
};

app.http("SyncElevmappe", {
  authLevel: "anonymous",
  methods: ["POST"],
  handler: syncElevmappeHandler
});
