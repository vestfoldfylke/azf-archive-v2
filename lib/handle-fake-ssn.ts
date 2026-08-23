import { logger } from "@vestfoldfylke/loglady";
import { COUNTY_NUMBER } from "../config.js";
import type { FakeSsnResponse } from "../types/archive.js";
import type { SIFGetPrivatePersonsResponse } from "../types/sif.js";
import callArchiveTemplate from "./call-archive-template.js";
import HTTPError from "./http-error.js";

const newFakeSsn = (birthdate: string, gender: string, runningNumber: number): string => {
  const dateList: string[] = birthdate.split("-");
  if (dateList.length !== 3) {
    throw new HTTPError(400, "birthdate must be on format YYYY-MM-DD");
  }

  const year: string = dateList[0];
  const month: string = dateList[1];
  const day: string = dateList[2];
  const birthdateFormatted: string = `${day}${month}${year.substring(2, 4)}`;
  const newBirthdate: string = `${Number(birthdateFormatted.substring(0, 1)) + 4}${birthdateFormatted.substring(1, 6)}`;
  const runningStr: string = runningNumber < 10 ? `0${runningNumber}` : `${runningNumber}`;
  const genderNumber: number = gender.toLowerCase() === "m" ? 1 : 2;

  return `${newBirthdate}${runningStr}${genderNumber}${COUNTY_NUMBER}`;
};

const getLastName = (name: string): string => {
  const nameList: string[] = name.split(" ");
  if (nameList.length < 2) {
    throw new HTTPError(400, "Name must have at least one whitespace in it...");
  }

  return nameList[nameList.length - 1];
};

const handleFakeSsn = async (birthdate: string, gender: string, name: string): Promise<FakeSsnResponse> => {
  if (!name) {
    throw new HTTPError(400, 'Missing required parameter "lastName"');
  }
  if (!birthdate) {
    throw new HTTPError(400, 'Missing required parameter "birthdate"');
  }
  if (!gender) {
    throw new HTTPError(400, 'Missing required parameter "gender"');
  }

  let foundUnique: boolean = false;
  let runningNumber: number = 99;
  let resultFakeSsn: string | null = null;
  let privatePersonResult: SIFGetPrivatePersonsResponse["PrivatePersons"] | null = null;
  const lastName: string = getLastName(name);

  while (!foundUnique) {
    const fakeSsn: string = newFakeSsn(birthdate, gender, runningNumber);

    logger.info("Check for existing PrivatePersons on fake ssn {FakeSsn}", fakeSsn);
    const privatePersonRes = (await callArchiveTemplate({ system: "archive", template: "get-private-person", parameter: { ssn: fakeSsn } })) as SIFGetPrivatePersonsResponse["PrivatePersons"];
    privatePersonResult = privatePersonRes;

    if (privatePersonRes.length === 1 && privatePersonRes[0].LastName === lastName) {
      logger.info("Found existing PrivatePersons on fake ssn {FakeSsn} with same lastName as provided in body, will use it", fakeSsn);
      foundUnique = true;
      resultFakeSsn = fakeSsn;
    } else if (privatePersonRes.length === 0) {
      logger.info("No PrivatePerson found on fake ssn {FakeSsn}, will use it to create new PrivatePerson", fakeSsn);
      foundUnique = true;
      resultFakeSsn = fakeSsn;
    } else if (privatePersonRes.length > 1) {
      throw new HTTPError(500, `Found several privatepersons on fake ssn ${fakeSsn}, send to arkivarer for handling (av tre pils og en godt stekt pizza (ikke glutenfri) til Jorgen)`);
    } else {
      logger.info("PrivatePerson found on fake ssn {FakeSsn}, but not matching lastNames, will generate new fakeSsn and continue checking.", fakeSsn);
      runningNumber -= 1;
      if (runningNumber < 1) {
        throw new Error(`AIAIA, no all 99 running numbers have been used up for fake ssn on birthdate ${birthdate} and gender ${gender} - what to do, what to do...`);
      }
      // Consider to add sleep function, if it fails a lot
    }
  }

  return { resultFakeSsn, privatePersonResult: privatePersonResult as SIFGetPrivatePersonsResponse["PrivatePersons"] };
};

export { handleFakeSsn, newFakeSsn };
