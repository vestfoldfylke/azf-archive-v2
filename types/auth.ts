import type { HttpResponseInit } from "@azure/functions";

export type DecodedAccessToken = {
  /** Did the token pass the checks */
  verified: boolean;
  /** Descriptive message if the verification failed */
  msg: string | null;
  /** Roles for the token */
  roles: string[];
  /** Application id */
  appid?: string;
  /** UserPrincipalName */
  upn?: string;
};

export type DecodedAccessTokenResponse = {
  decoded: DecodedAccessToken;
  errorResponse?: HttpResponseInit;
};
