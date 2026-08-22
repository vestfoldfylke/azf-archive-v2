import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { repackBrreg } from "../lib/repack-brreg-result.js";
import type { BrregAdresse, BrregEnhet, BrregEnhetRepacked } from "../types/brreg.js";
// biome-ignore lint/correctness/useImportExtensions: json file requires the .json extension
import data from "./data/brreg-data.json" with { type: "json" };

const addressFields: BrregAdresse = {
  land: "Norge",
  landkode: "NO",
  postnummer: "6969",
  poststed: "Prolapsbyen",
  adresse: ["Prolapsgata 4"],
  kommune: "Prolaps",
  kommunenummer: "1234"
};

describe("repackBrreg returns as expected when", () => {
  test("enterprise is active and has an forretningsadresse", () => {
    const enterprise: BrregEnhet = {
      ...(data as BrregEnhet),
      forretningsadresse: addressFields
    };

    const repackedEnterprise: BrregEnhetRepacked = repackBrreg(enterprise);
    assert.equal(repackedEnterprise.Name, enterprise.navn);
    assert.equal(repackedEnterprise.EnterpriseNumber, enterprise.organisasjonsnummer);
    assert.equal(repackedEnterprise.PostAddress.StreetAddress, addressFields.adresse[0]);
    assert.equal(repackedEnterprise.PostAddress.ZipCode, addressFields.postnummer);
    assert.equal(repackedEnterprise.PostAddress.ZipPlace, addressFields.poststed);
    assert.equal(repackedEnterprise.PostAddress.Country, addressFields.land);
    assert.equal(repackedEnterprise.PostAddress.County, addressFields.kommune);
    assert.equal(repackedEnterprise.OfficeAddress.StreetAddress, addressFields.adresse[0]);
    assert.equal(repackedEnterprise.OfficeAddress.ZipCode, addressFields.postnummer);
    assert.equal(repackedEnterprise.OfficeAddress.ZipPlace, addressFields.poststed);
    assert.equal(repackedEnterprise.OfficeAddress.Country, addressFields.land);
    assert.equal(repackedEnterprise.OfficeAddress.County, addressFields.kommune);
  });

  test("enterprise is active and has an beliggenhetsadresse", () => {
    const enterprise: BrregEnhet = {
      ...(data as BrregEnhet),
      beliggenhetsadresse: addressFields
    };

    const repackedEnterprise: BrregEnhetRepacked = repackBrreg(enterprise);
    assert.equal(repackedEnterprise.Name, enterprise.navn);
    assert.equal(repackedEnterprise.EnterpriseNumber, enterprise.organisasjonsnummer);
    assert.equal(repackedEnterprise.PostAddress.StreetAddress, addressFields.adresse[0]);
    assert.equal(repackedEnterprise.PostAddress.ZipCode, addressFields.postnummer);
    assert.equal(repackedEnterprise.PostAddress.ZipPlace, addressFields.poststed);
    assert.equal(repackedEnterprise.PostAddress.Country, addressFields.land);
    assert.equal(repackedEnterprise.PostAddress.County, addressFields.kommune);
    assert.equal(repackedEnterprise.OfficeAddress.StreetAddress, addressFields.adresse[0]);
    assert.equal(repackedEnterprise.OfficeAddress.ZipCode, addressFields.postnummer);
    assert.equal(repackedEnterprise.OfficeAddress.ZipPlace, addressFields.poststed);
    assert.equal(repackedEnterprise.OfficeAddress.Country, addressFields.land);
    assert.equal(repackedEnterprise.OfficeAddress.County, addressFields.kommune);
  });

  test("enterprise is active and has an postadresse", () => {
    const enterprise: BrregEnhet = {
      ...(data as BrregEnhet),
      postadresse: addressFields
    };

    const repackedEnterprise: BrregEnhetRepacked = repackBrreg(enterprise);
    assert.equal(repackedEnterprise.Name, enterprise.navn);
    assert.equal(repackedEnterprise.EnterpriseNumber, enterprise.organisasjonsnummer);
    assert.equal(repackedEnterprise.PostAddress.StreetAddress, addressFields.adresse[0]);
    assert.equal(repackedEnterprise.PostAddress.ZipCode, addressFields.postnummer);
    assert.equal(repackedEnterprise.PostAddress.ZipPlace, addressFields.poststed);
    assert.equal(repackedEnterprise.PostAddress.Country, addressFields.land);
    assert.equal(repackedEnterprise.PostAddress.County, addressFields.kommune);
    assert.equal(repackedEnterprise.OfficeAddress.StreetAddress, addressFields.adresse[0]);
    assert.equal(repackedEnterprise.OfficeAddress.ZipCode, addressFields.postnummer);
    assert.equal(repackedEnterprise.OfficeAddress.ZipPlace, addressFields.poststed);
    assert.equal(repackedEnterprise.OfficeAddress.Country, addressFields.land);
    assert.equal(repackedEnterprise.OfficeAddress.County, addressFields.kommune);
  });

  test("enterprise is active and has an forretningsadresse and a separate postadresse", () => {
    const postadresse: BrregAdresse = {
      land: "Norge",
      landkode: "NO",
      postnummer: "5678",
      poststed: "Postbyen",
      adresse: ["Postgata 1"],
      kommune: "Post",
      kommunenummer: "5678"
    };

    const enterprise: BrregEnhet = {
      ...(data as BrregEnhet),
      forretningsadresse: addressFields,
      postadresse
    };

    const repackedEnterprise: BrregEnhetRepacked = repackBrreg(enterprise);
    assert.equal(repackedEnterprise.Name, enterprise.navn);
    assert.equal(repackedEnterprise.EnterpriseNumber, enterprise.organisasjonsnummer);
    assert.equal(repackedEnterprise.PostAddress.StreetAddress, postadresse.adresse[0]);
    assert.equal(repackedEnterprise.PostAddress.ZipCode, postadresse.postnummer);
    assert.equal(repackedEnterprise.PostAddress.ZipPlace, postadresse.poststed);
    assert.equal(repackedEnterprise.PostAddress.Country, postadresse.land);
    assert.equal(repackedEnterprise.PostAddress.County, postadresse.kommune);
    assert.equal(repackedEnterprise.OfficeAddress.StreetAddress, addressFields.adresse[0]);
    assert.equal(repackedEnterprise.OfficeAddress.ZipCode, addressFields.postnummer);
    assert.equal(repackedEnterprise.OfficeAddress.ZipPlace, addressFields.poststed);
    assert.equal(repackedEnterprise.OfficeAddress.Country, addressFields.land);
    assert.equal(repackedEnterprise.OfficeAddress.County, addressFields.kommune);
  });
});

describe("repackBrreg throws an error when", () => {
  test("enterprise respons_klasse is SlettetEnhet", () => {
    const enterprise: BrregEnhet = {
      ...(data as BrregEnhet),
      respons_klasse: "SlettetEnhet",
      slettedato: "2023-10-01"
    };

    assert.throws(() => repackBrreg(enterprise), { message: `Enterprise with orgnr ${enterprise.organisasjonsnummer} is deleted in Brreg` });
  });

  test("enterprise is active but no postadresse, forretningsadresse or beliggenhetsadresse were found", () => {
    const enterprise: BrregEnhet = {
      ...(data as BrregEnhet),
      postadresse: undefined,
      forretningsadresse: undefined,
      beliggenhetsadresse: undefined
    };

    assert.throws(() => repackBrreg(enterprise), { message: `Enterprise with orgnr ${enterprise.organisasjonsnummer} has no registered address` });
  });
});
