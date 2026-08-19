import { logger } from "@vestfoldfylke/loglady";
import { BRREG } from "../config.js";
import HTTPError from "./http-error.js";
import { requestJson } from "./request-json.js";

const { url, branchUrl } = BRREG;

const getBrregData = async (orgnr: string, _context?: unknown): Promise<unknown> => {
  try {
    return await requestJson(`${url}${orgnr}`);
  } catch (_error) {
    try {
      return await requestJson(`${branchUrl}${orgnr}`);
    } catch (err) {
      const status = err instanceof HTTPError ? err.statusCode : 500;
      const e = err as { message?: string; toString: () => string };
      const data = err instanceof HTTPError ? (err.data ?? err.message) : e.message || e.toString();
      logger.error(`get-brreg-data - ${status} - ${data}`);
      throw new HTTPError(status, typeof data === "string" ? data : "Brreg lookup failed");
    }
  }
};

export { getBrregData };
