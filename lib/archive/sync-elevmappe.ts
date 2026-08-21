import { logger } from "@vestfoldfylke/loglady";
import { MAIL } from "../../config.js";
import type { SyncPrivatePersonResponse } from "../../types/elevmappe.js";
import type { SIFCase, SIFCasesResponse, SIFRecnoAndCaseNumberResponse } from "../../types/sif.js";
import callArchiveTemplate from "../call-archive-template.js";
import HTTPError from "../http-error.js";
import sendmail from "../send-mail.js";

const { toArchive } = MAIL;

const syncElevmappe = async (privatePerson: SyncPrivatePersonResponse): Promise<SIFRecnoAndCaseNumberResponse> => {
  const { ssn, firstName, lastName, streetAddress, recno, updated } = privatePerson;

  if (!ssn) {
    logger.error('Missing required parameter "privatePerson.ssn"');
    throw new HTTPError(400, 'Missing required parameter "privatePerson.ssn"');
  }
  if (!firstName) {
    logger.error('Missing required parameter "privatePerson.firstName"');
    throw new HTTPError(400, 'Missing required parameter "privatePerson.firstName"');
  }
  if (!lastName) {
    logger.error('Missing required parameter "privatePerson.lastName"');
    throw new HTTPError(400, 'Missing required parameter "privatePerson.lastName"');
  }

  // First, check if elevmappe already exists
  const elevmappe = await callArchiveTemplate({ system: "elevmappe", template: "get-elevmappe", parameter: { ssn } }) as SIFCasesResponse["Cases"];
  const elevmappeRes: SIFCase[] = elevmappe.filter((mappe: SIFCase) => mappe?.Status && mappe.Status !== "Utgår"); // Returns an array of Case-objects where status isn't "Utgår"

  if (elevmappeRes.length >= 1 && elevmappeRes[0].CaseNumber) {
    // Found one elevmappe, update it
    const firstElevmappe: SIFCase = elevmappeRes[0];

    if (elevmappeRes.length > 1) {
      let mailStr: string = "Arkiveringsroboten har funnet flere elevmapper på samme elev, og trenger at det ryddes i disse for å arkivere automatisk.<br><br><strong>Elevmapper:</strong><ul>";
      const caseNumbers: string[] = elevmappeRes.map((mappe: SIFCase) => {
        mailStr += `<li>${mappe.CaseNumber}</li>`;
        return mappe.CaseNumber;
      });

      mailStr += `</ul><br>Roboten ønsker seg <strong>${elevmappeRes[0].CaseNumber}</strong> som gjeldende elevmappe.<br><br>Roboten ordner resten selv når dette er ryddet opp.<br><br>Tusen takk!`;

      logger.warn("Found several elevmapper on ssn {Ssn} - CaseNumbers: {@CaseNumbers}", ssn, caseNumbers);
      await sendmail(
        {
          to: toArchive,
          subject: "Flere elevmapper på en elev",
          body: mailStr
        }
      );
    }

    const needsUpdate: boolean =
      updated ||
      firstElevmappe.Title !== "Elevmappe" ||
      firstElevmappe.UnofficialTitle !== `Elevmappe - ${firstName} ${lastName}` ||
      ((firstElevmappe.Contacts && firstElevmappe.Contacts.length > 0 && firstElevmappe.Contacts[0].Address.StreetAddress !== streetAddress) || false);

    if (needsUpdate) {
      // PrivatePerson was updated or elevmappe was not correct, update elevmappe as well
      logger.info(
        "syncElevmappe - Elevmappe '{CaseNumber}' metadata is different from person info (name, ssn, streetAddress), or has wrong case-metadata (title, unofficialTitle)), will update to match person info and case-metadata",
        firstElevmappe.CaseNumber
      );

      return await callArchiveTemplate({ system: "elevmappe", template: "update-elevmappe", parameter: { firstName, lastName, recno, caseNumber: elevmappeRes[0].CaseNumber } }) as SIFRecnoAndCaseNumberResponse;
    }

    logger.info("syncElevmappe - PrivatePerson was not updated, and elevmappe-metadata on case '{CaseNumber}' was correct, no need to update elevmappe", elevmappeRes[0].CaseNumber);
    return { Recno: elevmappeRes[0].Recno, CaseNumber: elevmappeRes[0].CaseNumber };
  }

  if (elevmappeRes.length === 0) {
    // No elevmappe found - create one
    logger.info("syncElevmappe - No elevmappe her gitt, will create");
    return await callArchiveTemplate({ system: "elevmappe", template: "create-elevmappe", parameter: { firstName, lastName, ssn, recno } }) as SIFRecnoAndCaseNumberResponse;
  }

  // Hit kommer vi egt aldri altså
  logger.error("syncElevmappe - Several elevmapper found on social security number: {Ssn}, send to arkivarer for handling", ssn);
  throw new HTTPError(500, `Several elevmapper found on social security number: ${ssn}, send to arkivarer for handling`);
};

export { syncElevmappe };
