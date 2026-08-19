import { logger } from "@vestfoldfylke/loglady";
import { KRR } from "../config.js";
import type { KRResponse, KRResult } from "../types/krr.js";
import HTTPError from "./http-error.js";
import { requestJson } from "./request-json.js";

const repackPhoneNumber = (phoneNumber: string): string => {
  if (!phoneNumber) throw new Error("Missing phoneNumber to repack");
  if (typeof phoneNumber !== "string") throw new Error("phoneNumber must be a string to repack");
  let repacked = phoneNumber.replace(/\s+/g, "");
  if (repacked.startsWith("+47") && repacked.length > 3) {
    repacked = `${repacked.slice(0, 3)} ${repacked.slice(3)}`;
  }
  return repacked;
};

const krr = async (ssn: string): Promise<KRResult | null> => {
  if (!ssn) throw new HTTPError(400, "Missing ssn for krr lookup");
  if (typeof ssn !== "string") throw new HTTPError(400, "ssn must be a string for krr lookup");
  if (ssn.length !== 11) throw new HTTPError(400, "ssn must be 11 digits for krr lookup");

  logger.info("Looking up person in KRR");
  const data = (await requestJson(KRR.url, {
    method: "POST",
    body: [ssn],
    headers: { "X-FUNCTIONS-KEY": KRR.apiKey }
  })) as KRResponse;

  if (!data.personer || !Array.isArray(data.personer)) {
    throw new HTTPError(500, "No personer array found in KRR response");
  }
  if (data.personer.length > 1) {
    throw new HTTPError(500, "More than one person found in KRR, this should not be possible");
  }
  if (data.personer.length === 0) {
    logger.info("No AKTIV person found in KRR");
    return null;
  }

  logger.info("Found person in KRR");
  const person = data.personer[0];
  if (person.varslingsstatus === "KAN_IKKE_VARSLES") {
    logger.info("Person has varslingsstatus KAN_IKKE_VARSLES, will not return email or phone number");
    return null;
  }

  return {
    email: person.kontaktinformasjon?.epostadresse,
    phoneNumber: person.kontaktinformasjon?.mobiltelefonnummer ? repackPhoneNumber(person.kontaktinformasjon.mobiltelefonnummer) : undefined
  };
};

export { krr };
