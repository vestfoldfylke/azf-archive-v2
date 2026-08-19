const { FINTFOLK } = require("../config.js");
const { getToken } = require("./get-entra-id-token.js");
const { requestJson } = require("./request-json.js");

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

module.exports = { callFintfolk };
