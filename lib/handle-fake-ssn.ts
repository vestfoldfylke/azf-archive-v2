import { logger } from "@vestfoldfylke/loglady";
import { COUNTY_NUMBER } from "../config.js";
import callArchiveTemplate from "./call-archive-template.js";
import HTTPError from "./http-error.js";

const newFakeSsn = (birthdate: string, gender: string, runningNumber: number): string => {
  const dateList = birthdate.split("-");
  if (dateList.length !== 3) throw new HTTPError(400, "birthdate must be on format YYYY-MM-DD");
  const year = dateList[0];
  const month = dateList[1];
  const day = dateList[2];
  const birthdateFormatted = `${day}${month}${year.substring(2, 4)}`;
  const newBirthdate = `${Number(birthdateFormatted.substring(0, 1)) + 4}${birthdateFormatted.substring(1, 6)}`;
  const runningStr = runningNumber < 10 ? `0${runningNumber}` : `${runningNumber}`;
  const genderNumber = gender.toLowerCase() === "m" ? 1 : 2;
  const countyNumber = COUNTY_NUMBER;
  return `${newBirthdate}${runningStr}${genderNumber}${countyNumber}`;
};

const getLastName = (name: string): string => {
  const nameList = name.split(" ");
  if (nameList.length < 2) throw new HTTPError(400, "Name must have at least one whitespace in it...");
  return nameList[nameList.length - 1];
};

const handleFakeSsn = async (birthdate: string, gender: string, name: string, context?: unknown): Promise<{ resultFakeSsn: string | undefined; privatePersonResult: unknown }> => {
  if (!name) {
    throw new HTTPError(400, 'Missing required parameter "lastName"');
  }
  if (!birthdate) {
    throw new HTTPError(400, 'Missing required parameter "birthdate"');
  }
  if (!gender) {
    throw new HTTPError(400, 'Missing required parameter "gender"');
  }

  let foundUnique = false;
  let runningNumber = 99;
  let resultFakeSsn: string | undefined;
  let privatePersonResult: unknown = null;
  const lastName = getLastName(name);
  while (!foundUnique) {
    const fakeSsn = newFakeSsn(birthdate, gender, runningNumber);
    logger.info(`Check for existing PrivatePersons on fake ssn ${fakeSsn}`);
    const privatePersonRes = (await callArchiveTemplate({ system: "archive", template: "get-private-person", parameter: { ssn: fakeSsn } }, context)) as Array<{ LastName?: string }>;
    privatePersonResult = privatePersonRes;
    if (privatePersonRes.length === 1 && privatePersonRes[0].LastName === lastName) {
      logger.info(`Found existing PrivatePersons on fake ssn ${fakeSsn} with same lastName as provided in body, will use it`);
      foundUnique = true;
      resultFakeSsn = fakeSsn;
    } else if (privatePersonRes.length === 0) {
      logger.info(`No PrivatePerson found on fake ssn ${fakeSsn}, will use it to create new PrivatePerson`);
      foundUnique = true;
      resultFakeSsn = fakeSsn;
    } else if (privatePersonRes.length > 1) {
      throw new HTTPError(500, `Found several privatepersons on fake ssn ${fakeSsn}, send to arkivarer for handling (av tre pils til Jorgen)`);
    } else {
      logger.info(`PrivatePerson found on fake ssn ${fakeSsn}, but not matching lastNames, will generate new fakeSsn and continue checking.`);
      runningNumber -= 1;
      if (runningNumber < 1) throw new Error(`AIAIA, no all 99 running numbers have been used up for fake ssn on birthdate ${birthdate} and gender ${gender} - what to do, what to do...`);
      // Consider to add sleep function, if it fails a lot
    }
  }

  return { resultFakeSsn, privatePersonResult };
};

export { handleFakeSsn, newFakeSsn };
