import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { repackBirthdate, repackFregAddress } from "../lib/archive/sync-private-person.js";
import type { FregResponse } from "../types/freg.js";
import type { RepackedBirthdate } from "../types/private-person.js";

const fregAddressRestProperties: FregResponse = {
  foedselsEllerDNummer: "",
  status: "",
  kanKontaktes: true,
  fornavn: "",
  etternavn: "",
  fulltnavn: "",
  foedselsdato: "",
  alder: 69,
  doedsfall: null,
  adressebeskyttelse: [],
  bostedsadresse: null,
  deltbostedsadresse: null,
  oppholdsadresse: null,
  postadresse: {
    adressegradering: "ugradert",
    gateadresse: "Tullball",
    postnummer: "0000",
    poststed: "Tull",
    landkode: "NO"
  },
  postadresseIUtlandet: null
};

const fregNoWorries: FregResponse = {
  ...fregAddressRestProperties,
  adressebeskyttelse: [],
  postadresse: {
    adressegradering: "ugradert",
    gateadresse: "Stavangvegen 90",
    postnummer: "6944",
    poststed: "STAVANG",
    landkode: "NO"
  }
};

const fregAddressBlockFortrolig: FregResponse = {
  ...fregAddressRestProperties,
  adressebeskyttelse: [],
  postadresse: {
    adressegradering: "fortrolig",
    gateadresse: "Stavangvegen 90",
    postnummer: "6944",
    poststed: "STAVANG",
    landkode: "NO"
  }
};

const fregAddressBlockKlientadresse: FregResponse = {
  ...fregAddressRestProperties,
  adressebeskyttelse: [],
  postadresse: {
    adressegradering: "klientadresse",
    gateadresse: "Stavangvegen 90",
    postnummer: "6944",
    poststed: "STAVANG",
    landkode: "NO"
  }
};

const fregAddressProtection: FregResponse = {
  ...fregAddressRestProperties,
  adressebeskyttelse: ["strengtFortrolig"],
  postadresse: {
    adressegradering: "ugradert",
    gateadresse: "Stavangvegen 90",
    postnummer: "6944",
    poststed: "STAVANG",
    landkode: "NO"
  }
};

const fregAddressProtectionAndBlock: FregResponse = {
  ...fregAddressRestProperties,
  adressebeskyttelse: ["fortrolig"],
  postadresse: {
    adressegradering: "fortrolig",
    gateadresse: "Stavangvegen 90",
    postnummer: "6944",
    poststed: "STAVANG",
    landkode: "NO"
  }
};

describe("Repack freg address works as expected when", () => {
  test("No address stuff is present", () => {
    const { address, addressProtection } = repackFregAddress(fregNoWorries);
    assert.equal(address.streetAddress, fregNoWorries.postadresse.gateadresse);
    assert.equal(addressProtection, false);
  });

  test("Address block fortrolig is present", () => {
    const { address, addressProtection } = repackFregAddress(fregAddressBlockFortrolig);
    assert.equal(address.streetAddress, "Sperret adresse (fortrolig)");
    assert.equal(addressProtection, true);
  });

  test("Address block klientadresse is present", () => {
    const { address, addressProtection } = repackFregAddress(fregAddressBlockKlientadresse);
    assert.equal(address.streetAddress, "Sperret adresse (klientadresse)");
    assert.equal(addressProtection, true);
  });

  test("Address protection is present", () => {
    const { address, addressProtection } = repackFregAddress(fregAddressProtection);
    assert.equal(address.streetAddress, fregNoWorries.postadresse.gateadresse);
    assert.equal(addressProtection, true);
  });

  test("Address protection and address block is present", () => {
    const { address, addressProtection } = repackFregAddress(fregAddressProtectionAndBlock);
    assert.equal(address.streetAddress, "Sperret adresse (fortrolig)");
    assert.equal(addressProtection, true);
  });
});

describe("repackBirthdate works as expected when", () => {
  test("birthdate is 2021-03-18", () => {
    const repackedBirthdate: RepackedBirthdate = repackBirthdate("2021-03-18");
    assert.equal(repackedBirthdate.regular, "180321");
    assert.equal(repackedBirthdate.fakeSsn, "580321");
  });
  test("birthdate is 1987-11-02", () => {
    const repackedBirthdate: RepackedBirthdate = repackBirthdate("1987-11-02");
    assert.equal(repackedBirthdate.regular, "021187");
    assert.equal(repackedBirthdate.fakeSsn, "421187");
  });
});
