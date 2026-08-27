import { type AuthenticationResult, type ClientCredentialRequest, ConfidentialClientApplication, type Configuration } from "@azure/msal-node";
import { logger } from "@vestfoldfylke/loglady";
import { APPREG_CLIENT } from "../config.js";

const config: Configuration = {
  auth: {
    clientId: APPREG_CLIENT.clientId,
    authority: `https://login.microsoftonline.com/${APPREG_CLIENT.tenantId}`,
    ["clientSecret"]: APPREG_CLIENT.clientSecret
  }
};

const confidentialClientApplication = new ConfidentialClientApplication(config);

async function getToken(scope: string): Promise<string> {
  const clientCredentials: ClientCredentialRequest = {
    scopes: [scope]
  };

  const result: AuthenticationResult | null = await confidentialClientApplication.acquireTokenByClientCredential(clientCredentials);
  if (!result?.accessToken) {
    throw new Error("getEntraIdToken - Failed to acquire access value from Microsoft");
  }

  if (result.fromCache) {
    logger.info("getEntraIdToken - Got token from ConfidentialClientApplication cache");
    return result.accessToken;
  }

  if (!result.expiresOn) {
    throw new Error("getEntraIdToken - Got new token, but no expiration, that can't be right...");
  }

  const expires: number = Math.floor((result.expiresOn.getTime() - Date.now()) / 1000);
  logger.info("getEntraIdToken - Got Microsoft access value, expires in {Expires} seconds.", expires);

  return result.accessToken;
}

export { getToken };
