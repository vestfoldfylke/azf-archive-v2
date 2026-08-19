const { logger } = require("@vtfk/logger");
const { KRR } = require("../config.js");
const HTTPError = require("./http-error.js");
const { requestJson } = require("./request-json.js");

const repackPhoneNumber = (phoneNumber) => {
  if (!phoneNumber) throw new Error("Missing phoneNumber to repack");
  if (typeof phoneNumber !== "string") throw new Error("phoneNumber must be a string to repack");
  let repacked = phoneNumber.replace(/\s+/g, "");
  if (repacked.startsWith("+47") && repacked.length > 3) {
    repacked = `${repacked.slice(0, 3)} ${repacked.slice(3)}`;
  }
  return repacked;
};

/**
 * @typedef {Object} KRRKontaktinformasjon
 * @property {string} epostadresse
 * @property {string} epostadresse_oppdatert
 * @property {string} epostadresse_sist_verifisert
 * @property {string} epostadresse_sist_validert
 * @property {string} epostadresse_duplisert
 * @property {string} mobiltelefonnummer
 * @property {string} mobiltelefonnummer_oppdatert
 * @property {string} mobiltelefonnummer_sist_verifisert
 * @property {string} mobiltelefonnummer_sist_validert
 * @property {string} mobiltelefonnummer_duplisert
 */

/**
 * @typedef {Object} KRRPerson
 * @property {string} personidentifikator
 * @property {"JA" | "NEI"} reservasjon
 * @property {"AKTIV" | "SLETTET" | "IKKE_REGISTRERT"} status
 * @property {"KAN_VARSLES" | "KAN_IKKE_VARSLES"} varslingsstatus
 * @property {KRRKontaktinformasjon} kontaktinformasjon
 * @property {string} sprak
 * @property {string} sprak_oppdatert
 * @property {string} oppdatert
 */

/**
 * @typedef {Object} KRRResponse
 * @property {KRRPerson[]} personer
 */

const krr = async (ssn) => {
  if (!ssn) throw new HTTPError(400, "Missing ssn for krr lookup");
  if (typeof ssn !== "string") throw new HTTPError(400, "ssn must be a string for krr lookup");
  if (ssn.length !== 11) throw new HTTPError(400, "ssn must be 11 digits for krr lookup");

  logger("info", ["Looking up person in KRR"]);
  /** @type { KRRResponse } */
  const data = await requestJson(KRR.url, {
    method: "POST",
    body: [ssn],
    headers: { "X-FUNCTIONS-KEY": KRR.apiKey }
  });

  if (!data.personer || !Array.isArray(data.personer)) {
    throw new HTTPError(500, "No personer array found in KRR response");
  }
  if (data.personer.length > 1) {
    throw new HTTPError(500, "More than one person found in KRR, this should not be possible");
  }
  if (data.personer.length === 0) {
    logger("info", ["No AKTIV person found in KRR"]);
    return null;
  }

  logger("info", ["Found person in KRR"]);
  const person = data.personer[0];
  if (person.varslingsstatus === "KAN_IKKE_VARSLES") {
    logger("info", ["Person has varslingsstatus KAN_IKKE_VARSLES, will not return email or phone number"]);
    return null;
  }

  return {
    email: person.kontaktinformasjon?.epostadresse,
    phoneNumber: person.kontaktinformasjon?.mobiltelefonnummer ? repackPhoneNumber(person.kontaktinformasjon.mobiltelefonnummer) : undefined
  };
};

module.exports = { krr };
