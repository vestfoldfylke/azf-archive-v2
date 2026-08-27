import type { DecodedAccessToken } from "../types/auth.js";

type JwtPayload = {
  upn: string | undefined;
  appid: string | undefined;
  roles: string[] | undefined;
};

// We only decode, as built in entra auth verifies. Decode only for metadata - not authentication.
const decodeJwt = (token: string): JwtPayload => {
  const base64Payload = token.replace("Bearer ", "").split(".")[1];
  const payload = Buffer.from(base64Payload, "base64url").toString();
  const parsed = JSON.parse(payload);
  if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("Payload is not a JSON object");
  }
  return parsed as JwtPayload;
};

export const decodeAccessToken = (token: string | null): DecodedAccessToken => {
  const result: DecodedAccessToken = {
    upn: "",
    appid: "",
    verified: false,
    msg: "",
    roles: []
  };

  if (!token) {
    result.msg = "Missing token in authorization header";
    return result;
  }

  let decoded: JwtPayload;
  try {
    decoded = decodeJwt(token);
  } catch (_error) {
    result.msg = "Token is not a valid jwt";
    return result;
  }

  const { upn, appid, roles } = decoded;
  if (!upn && !appid) {
    result.msg = "Token is missing upn or appId";
    return result;
  }

  result.appid = appid;
  result.upn = upn || "appReg";
  result.verified = true;
  result.roles = roles || [];

  return result;
};
