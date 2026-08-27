import { logger } from "@vestfoldfylke/loglady";
import { MAIL } from "../../config.js";
import type { Name, SyncElevmappeBody, SyncPrivatePersonMethod } from "../../types/elevmappe.js";
import type { FregRepackedResponse, FregResponse } from "../../types/freg.js";
import type { KRResult } from "../../types/krr.js";
import type { RepackedBirthdate, SyncPrivatePersonResponse } from "../../types/private-person.js";
import type { SIFGetPrivatePersonsResponse, SIFPrivatePersonResult, SIFRecnoResponse } from "../../types/sif.js";
import sendmail from "../send-mail.js";

type PrivatePersonDataWithSsn = Omit<SyncPrivatePersonResponse, "name" | "addressProtection" | "recno" | "updated" | "created">;

type PrivatePersonDataWithRecno = Omit<SyncPrivatePersonResponse, "name" | "addressProtection" | "ssn" | "updated" | "created">;

const { toArchiveAdministrator } = MAIL;

import callArchive from "../call-archive.js";
import callArchiveTemplate from "../call-archive-template.js";
import { fregNameBirthdate, fregSsn } from "../freg.js";
import { handleFakeSsn } from "../handle-fake-ssn.js";
import HTTPError from "../http-error.js";
import { krr } from "../krr.js";

// PrivatePersonToUpdate is the privatePerson object we got from P360, privatePersonData is the data we want to update with
const privatePersonIsUpToDate = (privatePersonToUpdate: SIFPrivatePersonResult, privatePersonData: PrivatePersonDataWithRecno): boolean => {
  if (!privatePersonToUpdate.PrivateAddress) {
    return false;
  }
  if (privatePersonData.streetAddress?.toLowerCase() !== privatePersonToUpdate.PrivateAddress.StreetAddress.toLowerCase()) {
    return false;
  }
  if (privatePersonData.zipCode !== privatePersonToUpdate.PrivateAddress.ZipCode) {
    return false;
  }
  if (privatePersonData.zipPlace !== privatePersonToUpdate.PrivateAddress.ZipPlace) {
    return false;
  }
  if (privatePersonData.firstName !== privatePersonToUpdate.FirstName) {
    return false;
  }
  if (privatePersonData.lastName !== privatePersonToUpdate.LastName) {
    return false;
  }
  if (privatePersonData.email && privatePersonData.email !== privatePersonToUpdate.Email) {
    return false;
  }
  if (privatePersonData.phoneNumber && privatePersonData.phoneNumber !== privatePersonToUpdate.PhoneNumber) {
    return false;
  }

  return true;
};

const getFirstAndLastName = (name: string): Partial<Name> => {
  const nameList: string[] = name.split(" ");
  if (nameList.length < 2) {
    throw new HTTPError(400, "Name must have at least one whitespace in it...");
  }

  const firstName: string = name.substring(0, name.lastIndexOf(" "));
  const lastName: string = nameList[nameList.length - 1];

  return { firstName, lastName };
};

const getNameFromFirstAndLastName = (firstName: string, lastName: string): string => {
  if (!firstName || !lastName) {
    throw new HTTPError(400, 'Missing required parameter. "firstName" and "lastName" are required');
  }

  return `${firstName} ${lastName}`;
};

const getName = (name: string | undefined, firstName: string | undefined, lastName: string | undefined): Partial<Name> => {
  if (name) {
    const { firstName, lastName } = getFirstAndLastName(name);
    return { firstName, lastName, fullName: name };
  }

  if (firstName && lastName) {
    const fullName: string = getNameFromFirstAndLastName(firstName, lastName);
    return { firstName, lastName, fullName };
  }

  return { firstName: undefined, lastName: undefined, fullName: undefined };
};

const getOrThrowSyncPrivatePersonMethod = (syncPrivatePersonData: SyncElevmappeBody): SyncPrivatePersonMethod => {
  const { ssn, name, birthdate, fakeSsn } = syncPrivatePersonData;

  if (birthdate) {
    if (typeof birthdate !== "string") {
      throw new HTTPError(400, "birthdate must be string");
    }

    const birthdateList: string[] = birthdate.split("-");
    if (birthdateList.length !== 3) {
      throw new HTTPError(400, "birthdate must be on format YYYY-MM-DD");
    }
    if ((birthdateList[0].length !== 4 || birthdateList[1].length !== 2 || birthdateList[2].length !== 2) && birthdateList.length !== 3) {
      throw new HTTPError(400, "birthdate must be on format YYYY-MM-DD");
    }
  }

  if (fakeSsn) {
    if (typeof fakeSsn !== "boolean") {
      throw new HTTPError(400, 'Parameter "fakeSsn" must be of type boolean - the fake ssn is generated based on birthdate and gender');
    }

    return "fakessn";
  }

  if (ssn) {
    return "ssn";
  }

  if (name && birthdate) {
    return "namebirthdate";
  }

  throw new HTTPError(400, 'SyncPrivatePerson requires one of these parameter combinations: ("fakeSsn"), ("ssn"), or ("name" and "birthdate")');
};

const repackFregAddress = (fregData: FregResponse): FregRepackedResponse => {
  const addressProtection: boolean = fregData.adressebeskyttelse.some((ele: string) => ["strengtFortrolig", "fortrolig"].includes(ele));
  const addressBlock: boolean = ["klientadresse", "fortrolig"].includes(fregData.postadresse.adressegradering);

  return {
    address: {
      streetAddress: addressBlock ? `Sperret adresse (${fregData.postadresse.adressegradering})` : fregData.postadresse.gateadresse,
      zipCode: fregData.postadresse.postnummer,
      zipPlace: fregData.postadresse.poststed
    },
    addressProtection: addressProtection || addressBlock
  };
};

const repackBirthdate = (birthdate: string): RepackedBirthdate => {
  // YYYY-MM-DD to DDMMYY and D+4DMMYY
  const dateList: string[] = birthdate.split("-");
  if (dateList.length !== 3) {
    throw new Error("Birthdate was not on format YYYY-MM-DD, wtf?");
  }

  const year: string = dateList[0].substring(2, 4);
  const month: string = dateList[1];
  const day: string = dateList[2];
  const add4toDay: string = `${Number(day.substring(0, 1)) + 4}${day.substring(1, 2)}`; // To also be able to find fake ssn

  return {
    regular: `${day}${month}${year}`,
    fakeSsn: `${add4toDay}${month}${year}`
  };
};

const syncPrivatePerson = async (syncPrivatePersonData: SyncElevmappeBody): Promise<SyncPrivatePersonResponse> => {
  const { ssn, name, birthdate, fakeSsn, gender, streetAddress, zipCode, zipPlace, forceUpdate, manualData, email, phoneNumber } = syncPrivatePersonData;

  const syncPrivatePersonMethod: SyncPrivatePersonMethod = getOrThrowSyncPrivatePersonMethod(syncPrivatePersonData);

  // Verify some parameters
  if (fakeSsn || manualData) {
    if (!name || !streetAddress || !zipCode || !zipPlace) {
      throw new HTTPError(400, 'When using fakeSsn or manualData, parameters "name", "streetAddress", "zipCode" and "zipPlace" are required');
    }
    if ([name, streetAddress, zipCode, zipPlace].some((ele: string) => typeof ele !== "string")) {
      throw new HTTPError(400, 'Parameters "name", "streetAddress", "zipCode" and "zipPlace" must be of type string');
    }
    if (email && typeof email !== "string") {
      throw new HTTPError(400, 'Parameter "email" must be of type string');
    }
    if (phoneNumber && typeof phoneNumber !== "string") {
      throw new HTTPError(400, 'Parameter "phoneNumber" must be of type string');
    }
  }

  // If we use birthdate and name - we already have fregData, so we cache it in case we need it
  let fregCache: FregResponse | null = null;

  let privatePersonRes: SIFGetPrivatePersonsResponse["PrivatePersons"] | null = null;

  /**
   * @type {string} depending on the identifier for the person - ssnToUse is the resulting ssn, which we will use to create or update the privatePerson
   */
  let ssnToUse: string | null = null;
  if (syncPrivatePersonMethod === "ssn") {
    // If we use ssn as identifier
    if (!ssn) {
      throw new HTTPError(400, 'Missing required parameter "ssn"');
    }
    if (typeof ssn !== "string" || ssn.length !== 11) {
      throw new HTTPError(400, 'Parameter "ssn" must be string of length 11');
    }

    logger.info('Identifier is "ssn" checking for PrivatePerson with provided ssn');
    privatePersonRes = (await callArchiveTemplate({ system: "archive", template: "get-private-person", parameter: { ssn } })) as SIFGetPrivatePersonsResponse["PrivatePersons"];
    ssnToUse = ssn;
  } else if (syncPrivatePersonMethod === "namebirthdate") {
    // If we use name and birthdate as identifier
    if (!name) {
      throw new HTTPError(400, 'Missing required parameter "name"');
    }
    if (!birthdate) {
      throw new HTTPError(400, 'Missing required parameter "birthdate"');
    }

    // Experimental - try to find person in P360 from name first - and then filter out on birthdate, if one match we assume it's good (could potentially give a false positive)
    if (!forceUpdate) {
      logger.info('Identifier is "name and birthdate", forceUpdate is false - we try to get privatePerson directly from P360');
      const namePrivatePersonRes = (await callArchive({ service: "ContactService", method: "GetPrivatePersons", parameter: { Name: name } })) as SIFGetPrivatePersonsResponse["PrivatePersons"];
      const repackedBirthdate: RepackedBirthdate = repackBirthdate(birthdate);
      const birthdateMatches: SIFGetPrivatePersonsResponse["PrivatePersons"] = namePrivatePersonRes.filter(
        (privatePerson: SIFPrivatePersonResult) =>
          privatePerson.PersonalIdNumber &&
          (privatePerson.PersonalIdNumber.substring(0, 6) === repackedBirthdate.regular || privatePerson.PersonalIdNumber.substring(0, 6) === repackedBirthdate.fakeSsn)
      ); // If match on name and birthdate as well

      if (birthdateMatches.length === 1) {
        logger.info('Identifier is "name and birthdate" found match directly in P360, will use ssn found in P360 as identifier for PrivatePerson');
        privatePersonRes = birthdateMatches;
        ssnToUse = birthdateMatches[0].PersonalIdNumber;
      } else {
        logger.info('Identifier is "name and birthdate" and could not find match directly in P360, will have to try freg');
      }
    }

    if (!ssnToUse) {
      // Original - if we haven't found directly in archive - we try from freg
      logger.info('Identifier is "name and birthdate" fetching ssn from freg with provided name and birthdate');
      const fregData: FregResponse = await fregNameBirthdate(name, birthdate); // If not found is handled by throw error inside the function
      fregCache = fregData;

      logger.info('Identifier is "name and birthdate" found ssn from freg, will use ssn found in freg as identifier for PrivatePerson');
      privatePersonRes = (await callArchiveTemplate({
        system: "archive",
        template: "get-private-person",
        parameter: { ssn: fregData.foedselsEllerDNummer }
      })) as SIFGetPrivatePersonsResponse["PrivatePersons"];
      ssnToUse = fregData.foedselsEllerDNummer;
    }
  } else if (syncPrivatePersonMethod === "fakessn") {
    // If we use fake ssn as identifier
    if (!birthdate) {
      throw new HTTPError(400, 'Missing required parameter "birthdate"');
    }
    if (!name) {
      throw new HTTPError(400, 'Missing required parameter "name"');
    }
    if (!gender) {
      throw new HTTPError(400, 'Missing required parameter "gender"');
    }

    logger.info('Identifier is "fakeSsn" running handleFakeSsn with provided name, birthdate and gender');
    const { resultFakeSsn, privatePersonResult } = await handleFakeSsn(birthdate, gender, name);
    privatePersonRes =
      privatePersonResult || ((await callArchiveTemplate({ system: "archive", template: "get-private-person", parameter: { ssn: fakeSsn } })) as SIFGetPrivatePersonsResponse["PrivatePersons"]);
    ssnToUse = resultFakeSsn;
  } else {
    throw new HTTPError(500, "Hit kommer vi aldri... (men vi gjør sikkert det...)");
  }

  // alright, alrigth, alright - now we have a privatepersonresult, and ssn for all cases, beautiful!
  if (!ssnToUse) {
    throw new HTTPError(500, "No ssn to use, something is wrong in the code... contact API responsible");
  }

  if (privatePersonRes === null) {
    privatePersonRes = [];
  }

  // This is the object we are going to return - see how it behaves in each of the cases below (should we add age as well?)
  const privatePerson: SyncPrivatePersonResponse = {
    ssn: ssnToUse,
    name: null,
    firstName: null,
    lastName: null,
    streetAddress: null,
    zipCode: null,
    zipPlace: null,
    addressProtection: null,
    email: null,
    phoneNumber: null,
    recno: null,
    updated: null,
    created: null
  };

  if (privatePersonRes.length === 0) {
    // No match - need to create
    logger.info("No matches on identifier data, creating new PrivatePerson");

    if (manualData || fakeSsn) {
      // CREATE with manual data
      const { firstName, lastName } = getFirstAndLastName(name as string);

      const privatePersonData: PrivatePersonDataWithSsn = {
        firstName: firstName as string | null,
        lastName: lastName as string | null,
        ssn: ssnToUse,
        streetAddress: streetAddress as string | null,
        zipCode: zipCode as string | null,
        zipPlace: zipPlace as string | null,
        email: email as string | null,
        phoneNumber: phoneNumber as string | null
      };

      const createPrivatePersonRes = (await callArchiveTemplate({ system: "archive", template: "create-private-person", parameter: privatePersonData })) as SIFRecnoResponse["Recno"];

      privatePerson.name = name as string | null;
      privatePerson.firstName = firstName as string | null;
      privatePerson.lastName = lastName as string | null;
      privatePerson.streetAddress = streetAddress as string | null;
      privatePerson.zipCode = privatePersonData.zipCode as string | null;
      privatePerson.zipPlace = privatePersonData.zipPlace as string | null;
      privatePerson.addressProtection = false;
      privatePerson.email = email || null;
      privatePerson.phoneNumber = phoneNumber || null;
      privatePerson.recno = createPrivatePersonRes;
      privatePerson.updated = false;
      privatePerson.created = true;
    } else {
      // Not manual or fakeSsn
      // CREATE privateperson with freg data
      const fregData: FregResponse = fregCache || (await fregSsn(ssnToUse)); // If not found is handled by throw error inside the function

      const { addressProtection, address } = repackFregAddress(fregData);

      // Hent også fra krr her, og legg på email og telefonnummer
      const krrData: KRResult | null = await krr(ssnToUse);

      const privatePersonData: PrivatePersonDataWithSsn = {
        firstName: fregData.fornavn,
        lastName: fregData.etternavn,
        ssn: ssnToUse,
        streetAddress: address.streetAddress,
        zipCode: address.zipCode,
        zipPlace: address.zipPlace,
        email: krrData?.email as string | null,
        phoneNumber: krrData?.phoneNumber as string | null
      };

      const createPrivatePersonRes = (await callArchiveTemplate({ system: "archive", template: "create-private-person", parameter: privatePersonData })) as SIFRecnoResponse["Recno"];

      privatePerson.name = fregData.fulltnavn;
      privatePerson.firstName = fregData.fornavn;
      privatePerson.lastName = fregData.etternavn;
      privatePerson.streetAddress = address.streetAddress;
      privatePerson.zipCode = address.zipCode;
      privatePerson.zipPlace = address.zipPlace;
      privatePerson.addressProtection = addressProtection;
      privatePerson.email = krrData?.email || null;
      privatePerson.phoneNumber = krrData?.phoneNumber || null;
      privatePerson.recno = createPrivatePersonRes;
      privatePerson.updated = false;
      privatePerson.created = true;
    }
    logger.info("Successfully created PrivatePerson wth Recno {Recno}", privatePerson.recno);
  } else {
    logger.info("Found {PrivatePersonLength} match(es) on identifier data", privatePersonRes.length);
    if (privatePersonRes.length > 1) {
      // One or more matches - check if there are too many
      // Send e-post til arkivet om at det er flere aktive privatpersoner på samme fnr
      const mailStrBlock: string = `Hallois, hallois!<br><br>Arkiveringsroboten har funnet flere privatpersoner i Public 360 med samme fødselsnummer, og trenger hjelp til å rydde opp i dette, for den vet ikke hvordan :( <br> Dokumenter og saker der privatpersonene er sakspart bør sikkert også sjekkes.<br><br>Fødselsnummeret det gjelder er <strong>${ssnToUse}</strong><br><br>Takker og bukker 😁`;
      await sendmail({
        to: toArchiveAdministrator,
        subject: "Jeg har funnet flere privatpersoner med samme fødselsnummer",
        body: mailStrBlock
      });
      logger.warn("syncPrivatePerson - Found several privatePerson on the same social security number: {Ssn}, sent mail to arkivarer for handling", ssnToUse);
    }

    const foundPrivatePerson: SIFPrivatePersonResult = privatePersonRes[0]; // take the first one

    if (forceUpdate) {
      // Her skal det oppdateres samma hva!
      logger.info("ForceUpdate is true, updating data on privatePerson with Recno: {Recno}", foundPrivatePerson.Recno);

      if (manualData || fakeSsn) {
        // UPDATE privateperson with manual data
        const { firstName, lastName } = getFirstAndLastName(name as string);

        const privatePersonData: PrivatePersonDataWithRecno = {
          recno: foundPrivatePerson.Recno,
          firstName: firstName as string | null,
          lastName: lastName as string | null,
          streetAddress: streetAddress as string | null,
          zipCode: zipCode as string | null,
          zipPlace: zipPlace as string | null,
          email: email as string | null,
          phoneNumber: phoneNumber as string | null
        };

        let updatePrivatePersonRes: SIFRecnoResponse["Recno"] | null = null;
        let updated: boolean = false;

        if (privatePersonIsUpToDate(foundPrivatePerson, privatePersonData)) {
          logger.info("PrivatePerson with Recno: {Recno} is already up to date, no need to update", foundPrivatePerson.Recno);
          updatePrivatePersonRes = foundPrivatePerson.Recno;
        } else {
          updatePrivatePersonRes = (await callArchiveTemplate({ system: "archive", template: "update-private-person", parameter: privatePersonData })) as SIFRecnoResponse["Recno"]; // Returns recno of updated privatePerson
          updated = true;
        }

        privatePerson.name = name as string | null;
        privatePerson.firstName = firstName as string | null;
        privatePerson.lastName = lastName as string | null;
        privatePerson.streetAddress = streetAddress as string | null;
        privatePerson.zipCode = privatePersonData.zipCode;
        privatePerson.zipPlace = privatePersonData.zipPlace;
        privatePerson.addressProtection = false;
        privatePerson.email = email || foundPrivatePerson.Email || null;
        privatePerson.phoneNumber = phoneNumber || foundPrivatePerson.PhoneNumber || null;
        privatePerson.recno = updatePrivatePersonRes;
        privatePerson.updated = updated;
        privatePerson.created = false;
      } else {
        // Kjører FREG oppdatering
        // UPDATE privateperson with freg data
        const fregData: FregResponse = fregCache || (await fregSsn(ssnToUse)); // If not found is handled by throw error inside the function

        const { addressProtection, address } = repackFregAddress(fregData);

        // Hent også fra krr her, og legg på email og telefonnummer
        const krrData: KRResult | null = await krr(ssnToUse);

        const privatePersonData: PrivatePersonDataWithRecno = {
          recno: foundPrivatePerson.Recno,
          firstName: fregData.fornavn,
          lastName: fregData.etternavn,
          streetAddress: address.streetAddress,
          zipCode: address.zipCode,
          zipPlace: address.zipPlace,
          email: krrData?.email as string | null,
          phoneNumber: krrData?.phoneNumber as string | null
        };

        let updatePrivatePersonRes: SIFRecnoResponse["Recno"] | null = null;
        let updated: boolean = false;

        if (privatePersonIsUpToDate(foundPrivatePerson, privatePersonData)) {
          logger.info("PrivatePerson with Recno: {Recno} is already up to date, no need to update", foundPrivatePerson.Recno);
          updatePrivatePersonRes = foundPrivatePerson.Recno;
        } else {
          updatePrivatePersonRes = (await callArchiveTemplate({ system: "archive", template: "update-private-person", parameter: privatePersonData })) as SIFRecnoResponse["Recno"]; // Returns recno of updated privatePerson
          updated = true;
        }

        privatePerson.name = fregData.fulltnavn;
        privatePerson.firstName = fregData.fornavn;
        privatePerson.lastName = fregData.etternavn;
        privatePerson.streetAddress = address.streetAddress;
        privatePerson.zipCode = address.zipCode;
        privatePerson.zipPlace = address.zipPlace;
        privatePerson.addressProtection = addressProtection;
        privatePerson.email = krrData?.email || foundPrivatePerson.Email || null;
        privatePerson.phoneNumber = krrData?.phoneNumber || foundPrivatePerson.PhoneNumber || null;
        privatePerson.recno = updatePrivatePersonRes;
        privatePerson.updated = updated;
        privatePerson.created = false;
      }

      logger.info("Successfully updated data on privatePerson with Recno: {Recno}", foundPrivatePerson.Recno);
    } else {
      // Vi trenger ikke oppdatere, kan bare returnere luringen
      const addressProtection: boolean = Boolean(foundPrivatePerson.PrivateAddress.StreetAddress?.toLowerCase().includes("sperret"));

      privatePerson.name = `${foundPrivatePerson.FirstName} ${foundPrivatePerson.LastName}`;
      privatePerson.firstName = foundPrivatePerson.FirstName;
      privatePerson.lastName = foundPrivatePerson.LastName;
      privatePerson.streetAddress = foundPrivatePerson.PrivateAddress.StreetAddress;
      privatePerson.zipCode = foundPrivatePerson.PrivateAddress.ZipCode;
      privatePerson.zipPlace = foundPrivatePerson.PrivateAddress.ZipPlace;
      privatePerson.addressProtection = addressProtection;
      privatePerson.email = foundPrivatePerson.Email || null;
      privatePerson.phoneNumber = foundPrivatePerson.PhoneNumber || null;
      privatePerson.recno = foundPrivatePerson.Recno;
      privatePerson.updated = false;
      privatePerson.created = false;
    }
  }

  // Check if we should email archive about address protection
  if (privatePerson.addressProtection) {
    // Send e-post til arkivet om at det er flere aktive privatpersoner på samme fnr
    const mailStrBlock: string = `Hallois, hallois!<br><br>Arkiveringsroboten har håndtert en privatperson i Public 360 med adressebeskyttelse (klientadresse, fortrolig, eller strengtFortrolig), og sier i fra til dere, slik at dere kan sjekke at alt er på stell om dere ønsker.<br><br>Privatpersonen har recno <strong>${privatePerson.recno}</strong><br><br>Ha en strålende dag! 😁`;
    await sendmail({
      to: toArchiveAdministrator,
      subject: "Håndtert en privatperson med adressebeskyttelse",
      body: mailStrBlock
    });
    logger.warn("syncPrivatePerson - Handled privatePerson with addressProtection, Recno: {Recno}", privatePerson.recno);
  }

  // Do a simple check that no values are null, to make sure the api works
  for (const [key, value] of Object.entries(privatePerson)) {
    if (!["email", "phoneNumber"].includes(key) && value === null) {
      throw new HTTPError(500, `Oh no, ${key} has null value, developer has made a mistake, tell you know who to fix it...`, privatePerson);
    }
  }

  // Then return the privatePerson
  return privatePerson;
};

export { getName, getOrThrowSyncPrivatePersonMethod, repackBirthdate, repackFregAddress, syncPrivatePerson };
