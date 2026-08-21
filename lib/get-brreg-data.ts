import { logger } from "@vestfoldfylke/loglady";
import { BRREG } from "../config.js";
import HTTPError from "./http-error.js";
import { requestJson } from "./request-json.js";

const { url, branchUrl } = BRREG;

const getBrregData = async (orgnr: string): Promise<unknown> => {
  try {
    return await requestJson(`${url}${orgnr}`);
  } catch {
    try {
      return await requestJson(`${branchUrl}${orgnr}`);
    } catch (error) {
      if (error instanceof HTTPError) {
        logger.errorException(error, "get-brreg-data - Status: {Status} - Data: {@Data}", error.statusCode, error.data as object);
        throw new HTTPError(error.statusCode, error.message || "Brreg lookup failed");
      }

      logger.errorException(error, "get-brreg-data");
      throw new HTTPError(500, (error as Error).message);
    }
  }
};

export { getBrregData };
