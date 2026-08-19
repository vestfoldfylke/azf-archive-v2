const { ARCHIVE } = require("../config.js");
const { logger } = require("@vestfoldfylke/loglady");
const { hasSifError, repackSifResult, repackUglySifError, filterSifResult } = require("./repack-sif-result.js");
const HTTPError = require("./http-error.js");
const { requestJson } = require("./request-json.js");

const constructRequest = (config) => {
  const { service, method } = config;
  const url = `${ARCHIVE.url}/${service}/${method}?clientId=${ARCHIVE.clientId}`;
  const headers = { Authorization: `authkey ${ARCHIVE.authkey}` };
  return { url, headers };
};

/**
 * @typedef {Object} SIFResponse
 * @property {boolean} Successful
 * @property {string} ErrorMessage
 * @property {string} ErrorDetails
 * @property {number} [TotalCount]
 * @property {number} [TotalPageCount]
 * @property {string} [NextDeltaLastDate]
 * @property {Object.<string, any>} [whatever] - the actual data returned from SIF
 */

/**
 *
 * @param {Object} archiveData
 * @param {string} archiveData.service
 * @param {string} archiveData.method
 * @param {Object} archiveData.parameter
 * @param {Object} [archiveData.options]
 * @param {Object} [context]
 * @returns
 */
module.exports = async (archiveData, _context) => {
  const { parameter, options, service, method } = archiveData;
  const { url, headers } = constructRequest(archiveData);
  logger.info(`Sending request to P360 - service - ${service} - method - ${method}`);

  const isGet = method.toLowerCase().startsWith("get");
  if (isGet && !parameter.SortingCriterion) {
    parameter.SortingCriterion = "RecnoDescending";
  }

  /** @type { SIFResponse } */
  const data = await requestJson(url, { method: "POST", body: { parameter }, headers });
  logger.info(`Got response - service - ${service} - method - ${method}`);

  if (archiveData.method.toLowerCase() === "ping") {
    logger.info("Ping pong, quick return");
    return "Ping successful :)";
  }

  if (hasSifError(data)) {
    throw new HTTPError(500, repackUglySifError(data).ErrorMessage || "Archive call failed");
  }

  let result = repackSifResult(data);

  if (isGet && Array.isArray(result)) {
    let page = 1;
    const totalPages = data.TotalPageCount || 1;
    logger.info(`Request was a get, total pages: ${totalPages}`);
    let finished = totalPages <= 1 || (options?.limit && options.limit <= result.length);
    if (finished) {
      if (totalPages <= 1) {
        logger.info("Only one page, no need to fetch more");
      } else {
        logger.info(`Limit reached (${options.limit} items), not fetching more`);
      }
    }
    while (!finished) {
      logger.info(`More boring stuff here, fetching page ${page + 1} of ${totalPages}`);
      parameter.Page = page;
      /** @type { SIFResponse } */
      const pageResult = await requestJson(url, { method: "POST", body: { parameter }, headers });
      logger.info(`Got response - service - ${service} - method - ${method} - page - ${page + 1}`);

      if (hasSifError(pageResult)) {
        throw new HTTPError(500, repackUglySifError(pageResult).ErrorMessage || "Archive call failed");
      }
      const repackedPage = repackSifResult(pageResult);
      result = [...result, ...repackedPage];
      page++;
      finished = page >= totalPages || (options?.limit && options.limit <= result.length);
      if (finished) {
        if (page >= totalPages) {
          if (result.length !== data.TotalCount)
            throw new HTTPError(500, `P360 said there was ${data.TotalCount} items, but we got ${result.length} items after fetching ${page} pages - call support`);
          logger.info(`Got all ${page} of ${totalPages} pages. Let us pray and return`);
        } else {
          logger.info(`Limit reached (${options.limit} items), not fetching more`);
        }
      }
    }
    if (options && typeof options === "object") {
      result = filterSifResult(result, options);
    }
  }
  return result;
};
