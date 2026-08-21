import { logger } from "@vestfoldfylke/loglady";
import { ARCHIVE } from "../config.js";
import type { CallArchiveInput, SIFRawResponse } from "../types/sif.js";
import HTTPError from "./http-error.js";
import { filterSifResult, hasSifError, repackSifResult, repackUglySifError } from "./repack-sif-result.js";
import { requestJson } from "./request-json.js";

type FetchRequest = {
  url: string;
  headers: Record<string, string>;
};

const constructRequest = (config: CallArchiveInput): FetchRequest => {
  const url: string = `${ARCHIVE.url}/${config.service}/${config.method}?clientId=${ARCHIVE.clientId}`;
  const headers = {
    Authorization: `authkey ${ARCHIVE.authkey}`
  };

  return { url, headers };
};

export default async (archiveData: CallArchiveInput): Promise<unknown> => {
  const { parameter, options, service, method } = archiveData;
  const fetchRequest: FetchRequest = constructRequest(archiveData);
  logger.info("Sending request to P360 - service - {Service} - method - {Method}", service, method);

  const isGet: boolean = method.toLowerCase().startsWith("get");
  if (isGet && !parameter.SortingCriterion) {
    parameter.SortingCriterion = "RecnoDescending";
  }

  const data = (await requestJson(fetchRequest.url, { method: "POST", body: { parameter }, headers: fetchRequest.headers })) as SIFRawResponse;
  logger.info("Got response - service - {Service} - method - {Method}", service, method);

  if (archiveData.method.toLowerCase() === "ping") {
    logger.info("Ping pong, quick return");
    return "Ping successful :)";
  }

  if (hasSifError(data)) {
    throw new HTTPError(500, repackUglySifError(data).ErrorMessage || "Archive call failed");
  }

  const result: unknown[] = repackSifResult(data) as unknown[];

  if (!(isGet && Array.isArray(result))) {
    return result;
  }

  let page: number = 1;
  const totalPages: number = data.TotalPageCount || 1;

  logger.info("Request was a get, total pages: {TotalPageCount}", totalPages);
  let finished: boolean = totalPages <= 1 || Boolean(options?.limit && options.limit <= result.length);

  if (finished) {
    if (totalPages <= 1) {
      logger.info("Only one page, no need to fetch more");
    } else {
      logger.info("Limit reached ({Limit} items), not fetching more", options?.limit);
    }
  }

  while (!finished) {
    logger.info("More boring stuff here, fetching page {PageNumber} of {TotalPageCount}", page + 1, totalPages);
    parameter.Page = page;
    const pageResult = (await requestJson(fetchRequest.url, { method: "POST", body: { parameter }, headers: fetchRequest.headers })) as SIFRawResponse;
    logger.info("Got response - service - {Service} - method - {Method} - page - {PageNumber}", service, method, page + 1);

    if (hasSifError(pageResult)) {
      throw new HTTPError(500, repackUglySifError(pageResult).ErrorMessage || "Archive call failed");
    }

    const repackedPage: unknown[] = repackSifResult(pageResult) as unknown[];
    result.push(...repackedPage);
    page++;
    finished = page >= totalPages || Boolean(options?.limit && options.limit <= result.length);

    if (finished) {
      if (page >= totalPages) {
        if (result.length !== data.TotalCount) {
          throw new HTTPError(500, `P360 said there was ${data.TotalCount} items, but we got ${result.length} items after fetching ${page} pages - call support`);
        }
        logger.info("Got all {PageNumber} of {TotalPageCount} pages. Let us pray and return", page, totalPages);
      } else {
        logger.info("Limit reached ({Limit} items), not fetching more", options?.limit);
      }
    }
  }

  if (options && typeof options === "object") {
    return filterSifResult(result, options);
  }

  return result;
};
