import { logger } from "@vestfoldfylke/loglady";
import { ARCHIVE_ROLE } from "../config.js";
import type { DecodedAccessToken, DecodedAccessTokenResponse } from "../types/auth.js";
import { decodeAccessToken } from "./decode-access-token.js";
import { httpResponse } from "./http-response.js";

export const validateAndGetToken = (token: string | null): DecodedAccessTokenResponse => {
  const decoded: DecodedAccessToken = decodeAccessToken(token);

  if (!decoded.verified) {
    logger.warn("Token is not valid - {Message}", decoded.msg);
    return {
      decoded,
      errorResponse: httpResponse(401, decoded.msg ?? "Token is not valid")
    };
  }

  logger.info("Validating role");
  if (!decoded.roles.includes(ARCHIVE_ROLE)) {
    logger.warn("Missing required role for access. Roles present: {@Roles}", decoded.roles);
    return {
      decoded,
      errorResponse: httpResponse(403, "Missing required role for access")
    };
  }

  return { decoded };
};
