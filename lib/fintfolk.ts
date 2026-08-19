import { FINTFOLK } from "../config.js";
import { getToken } from "./get-entra-id-token.js";
import { requestJson } from "./request-json.js";

/**
 *
 * @param {string} resource on the form "{resource}/{identifikator}/{identifikatorverdi}?{params}"
 * @returns response
 */
const callFintfolk = async (resource) => {
  return await requestJson(`${FINTFOLK.url}/${resource}`, {
    headers: { Authorization: `Bearer ${await getToken(FINTFOLK.scope)}` }
  });
};

export { callFintfolk };
