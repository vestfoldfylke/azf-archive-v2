import { app, type HttpRequest, type HttpResponseInit, type InvocationContext } from "@azure/functions";
import { logger } from "@vestfoldfylke/loglady";
import { ARCHIVE_ROLE } from "../../config.js";
import { getName, getSyncPrivatePersonMethod, syncPrivatePerson } from "../../lib/archive/sync-private-person.js";
import { decodeAccessToken } from "../../lib/decode-access-token.js";
import { httpResponse } from "../../lib/http-response.js";

const syncPrivatePersonHandler = async (request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> => {
  logger.logConfig({ prefix: "SyncPrivatePerson", contextId: context.invocationId });

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

  logger.logConfig({ prefix: `SyncPrivatePerson - clientId ${decoded.appid}${decoded.upn ? ` - ${decoded.upn}` : ""}`, contextId: context.invocationId });
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
    const privatePerson = await syncPrivatePerson(syncPrivatePersonData, context);
    logger.info("Succesfully synced PrivatePerson");
    return httpResponse(200, { privatePerson });
  } catch (error) {
    const err = error as { stack?: string; toString: () => string };
    logger.error(`error when syncing privatePerson - ${err.stack || err.toString()}`);
    return httpResponse(500, err as Error);
  }
};

app.http("SyncPrivatePerson", {
  authLevel: "anonymous",
  methods: ["POST"],
  handler: syncPrivatePersonHandler
});
