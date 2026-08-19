const { logger } = require("@vestfoldfylke/loglady");
const HTTPError = require("./http-error.js");
const {
  BRREG: { url, branchUrl }
} = require("../config.js");
const { requestJson } = require("./request-json.js");

const getBrregData = async (orgnr, _context) => {
  try {
    return await requestJson(`${url}${orgnr}`);
  } catch (_error) {
    try {
      return await requestJson(`${branchUrl}${orgnr}`);
    } catch (err) {
      const status = err instanceof HTTPError ? err.statusCode : 500;
      const data = err instanceof HTTPError ? (err.data ?? err.message) : err.message || err.toString();
      logger.error(`get-brreg-data - ${status} - ${data}`);
      throw new HTTPError(status, data);
    }
  }
};

module.exports = { getBrregData };
