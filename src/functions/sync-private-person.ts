import { app, type HttpRequest, type HttpResponseInit, type InvocationContext } from "@azure/functions";
import { logger } from "@vestfoldfylke/loglady";
import { getName, getSyncPrivatePersonMethod, syncPrivatePerson } from "../../lib/archive/sync-private-person.js";
import HTTPError from "../../lib/http-error.js";
import { httpResponse } from "../../lib/http-response.js";
import { validateAndGetToken } from "../../lib/validate-and-get-token.js";
import { updateContext } from "../middleware/async-local-context.js";
import { logContextHandling } from "../middleware/logcontext-handling.js";

const syncPrivatePersonHandler = async (request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> => {
  updateContext({ prefix: "SyncPrivatePerson", contextId: context.invocationId });

  const { decoded, errorResponse } = validateAndGetToken(request.headers.get("authorization"));
  if (errorResponse) {
    return errorResponse;
  }

  updateContext({ prefix: `SyncPrivatePerson - clientId ${decoded.appid}${decoded.upn ? ` - ${decoded.upn}` : ""}`, contextId: context.invocationId });
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

  try {
    logger.info("Syncing PrivatePerson");
    getSyncPrivatePersonMethod(syncPrivatePersonData);
    const privatePerson = await syncPrivatePerson(syncPrivatePersonData);
    logger.info("Successfully synced PrivatePerson");

    return httpResponse(200, { privatePerson });
  } catch (error) {
    if (error instanceof HTTPError) {
      logger.errorException(error, "Error when syncing privatePerson - Status: {Status} - Data: {@Data}", error.statusCode, error.data as object);
      return httpResponse(error.statusCode, error);
    }

    logger.errorException(error, "Error when syncing privatePerson");
    return httpResponse(500, error);
  }
};

app.http("SyncPrivatePerson", {
  authLevel: "anonymous",
  methods: ["POST"],
  handler: async (request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> => await logContextHandling(request, context, syncPrivatePersonHandler)
});
