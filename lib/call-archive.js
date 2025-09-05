const axios = require('axios')
const { ALLOW_LEGACY_RENEGOTIATION, ARCHIVE } = require('../config')
const crypto = require('crypto')
const https = require('https')
const { logger } = require('@vtfk/logger')
const { hasSifError, repackSifResult, repackUglySifError } = require('./repack-sif-result')
const HTTPError = require('./http-error')

const constructRequest = config => {
  const { service, method } = config
  const url = `${ARCHIVE.url}/${service}/${method}?clientId=${ARCHIVE.clientId}`
  const headers = { Authorization: `authkey ${ARCHIVE.authkey}` }
  return { url, headers }
}

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
module.exports = async (archiveData, context) => {
  const { parameter, options, service, method } = archiveData
  const { url, headers } = constructRequest(archiveData)
  const httpOptions = ALLOW_LEGACY_RENEGOTIATION ? { httpsAgent: new https.Agent({ secureOptions: crypto.constants.SSL_OP_LEGACY_SERVER_CONNECT }) } : {}
  logger('info', ['Sending request to P360', 'service', service, 'method', method], context)

  const isGet = method.toLowerCase().startsWith('get')
  if (isGet && !parameter.SortingCriterion) {
    parameter.SortingCriterion = 'RecnoDescending' // Default to newest items first
  }

  /** @type { { data: SIFResponse } } */
  const { data } = await axios.post(url, { parameter }, { ...httpOptions, headers })
  logger('info', ['Got response', 'service', service, 'method', method], context)

  // Method Ping does not return a body - only status
  if (archiveData.method.toLowerCase() === 'ping') {
    logger('info', 'Ping pong, quick return', context)
    return 'Ping successful :)'
  }

  // SIF does not use http codes - check if successful
  if (hasSifError(data)) {
    throw new HTTPError(500, repackUglySifError(data).ErrorMessage || 'Archive call failed')
  }

  let result = repackSifResult(data)

  // Idiot pagination, i dont ork to rewrite this now
  if (isGet && Array.isArray(result)) {
    let page = 1
    const totalPages = data.TotalPageCount || 1
    logger('info', `Request was a get, total pages: ${totalPages}`, context)
    let finished = totalPages <= 1 || (options && options.limit && options.limit <= result.length)
    while (!finished) {
      logger('info', `More boring stuff here, fetching page ${page + 1} of ${totalPages}`, context)
      parameter.Page = page
      /** @type { { data: SIFResponse } } */
      const pageResult = await axios.post(url, { parameter }, { ...httpOptions, headers })
      logger('info', ['Got response', 'service', service, 'method', method, 'page', `${page + 1}`], context)

      if (hasSifError(pageResult.data)) {
        throw new HTTPError(500, repackUglySifError(pageResult.data).ErrorMessage || 'Archive call failed')
      }
      const repackedPage = repackSifResult(pageResult.data) // Should for the sake of christ be an array
      result = [...result, ...repackedPage]
      page++
      finished = page >= totalPages || (options && options.limit && options.limit <= result.length)
      if (finished) {
        if (result.length !== data.TotalCount) throw new HTTPError(500, `P360 said there was ${data.TotalCount} items, but we got ${result.length} items after fetching ${page} pages - call support`)
        logger('info', `Got all ${page} of ${totalPages} pages. Let us pray and continue`, context)
      }
    }
    // Only open or exclude expired Cases Option
    if (options?.onlyOpenCases) {
      result = result.filter(({ Status }) => Status === 'Under behandling')
    } else if (options?.excludeExpiredCases) {
      result = result.filter(({ Status }) => Status !== 'Utgår')
    }
    // Limit options
    if (options?.limit === 1) {
      if (result.length > 0) {
        return result[0]
      } else {
        return null // jaja...
      }
    } else if (options?.limit > 1) {
      return result.slice(0, options.limit)
    }
  }
  return result
}
