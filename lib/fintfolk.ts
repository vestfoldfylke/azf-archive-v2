import { FINTFOLK } from "../config.js";
import type { FintEmployee } from "../types/fint.js";
import { getToken } from "./get-entra-id-token.js";
import { requestJson } from "./request-json.js";

/**
 *
 * @param {string} resource on the form "{resource}/{identifikator}/{identifikatorverdi}?{params}"
 * @returns response
 */
const callFintfolk = async (resource: string): Promise<FintEmployee> => {
  return (await requestJson(`${FINTFOLK.url}/${resource}`, {
    headers: { Authorization: `Bearer ${await getToken(FINTFOLK.scope)}` }
  })) as FintEmployee;
};

export { callFintfolk };
