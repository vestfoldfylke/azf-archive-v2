import { ConfidentialClientApplication } from "@azure/msal-node";
import { logger } from "@vestfoldfylke/loglady";
import NodeCache from "node-cache";
import { APPREG_CLIENT } from "../config.js";

const cache = new NodeCache({ stdTTL: 4000 });

async function getToken(scope: string, options: { forceNew: boolean } = { forceNew: false }): Promise<string> {
  const cacheKey = scope;

  if (!options.forceNew && cache.get(cacheKey)) {
    logger.info("getEntraIdToken - found valid access value in cache, will use that instead of fetching new");
    return cache.get(cacheKey) as string;
  }

  logger.info("getEntraIdToken - no access value in cache, fetching new from Microsoft");
  const config = {
    auth: {
      clientId: APPREG_CLIENT.clientId,
      authority: `https://login.microsoftonline.com/${APPREG_CLIENT.tenantId}`,
      ["clientSecret"]: APPREG_CLIENT.clientSecret
    }
  };

  const cca = new ConfidentialClientApplication(config);
  const clientCredentials = {
    scopes: [scope]
  };

  const result = await cca.acquireTokenByClientCredential(clientCredentials);
  if (!result?.accessToken || !result.expiresOn) {
    throw new Error("getEntraIdToken - Failed to acquire access value from Microsoft");
  }
  const expires = Math.floor((result.expiresOn.getTime() - Date.now()) / 1000);
  logger.info(`getEntraIdToken - Got Microsoft access value, expires in ${expires} seconds.`);
  cache.set(cacheKey, result.accessToken, expires);
  logger.info("getEntraIdToken - Access value stored in cache");

  return result.accessToken;
}

export { getToken };
