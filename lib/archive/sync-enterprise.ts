import { logger } from "@vestfoldfylke/loglady";
import { MAIL } from "../../config.js";
import type { CallArchiveInput } from "../../types/archive.js";
import type { BrregEnhetRepacked } from "../../types/brreg.js";
import type { SyncEnterpriseResponse } from "../../types/enterprise.js";
import type { SIFGetEnterprisesResponse, SIFRecnoResponse } from "../../types/sif.js";
import callArchive from "../call-archive.js";
import callArchiveTemplate from "../call-archive-template.js";
import sendmail from "../send-mail.js";

const { toArchiveAdministrator } = MAIL;

const syncEnterprise = async (enterprise: BrregEnhetRepacked): Promise<SyncEnterpriseResponse> => {
  const result: SyncEnterpriseResponse = {
    ...enterprise,
    recno: 0,
    updated: false,
    created: false
  };

  const enterpriseRes: SIFGetEnterprisesResponse["Enterprises"] = (await callArchiveTemplate({
    system: "archive",
    template: "get-enterprise",
    parameter: { orgnr: enterprise.EnterpriseNumber }
  })) as SIFGetEnterprisesResponse["Enterprises"];

  if (enterpriseRes.length === 0) {
    const payload: CallArchiveInput = {
      service: "ContactService",
      method: "SynchronizeEnterprise",
      parameter: enterprise
    };

    result.recno = (await callArchive(payload)) as SIFRecnoResponse["Recno"];
    result.created = true;

    return result;
  }

  if (enterpriseRes.length > 1) {
    const mailStrBlock = `Arkiveringsroboten har funnet duplikate virksomheter i P360. Kan dere hjelpe meg ved å rydde opp virksomheter med orgnr: ${enterprise.EnterpriseNumber}? Tusen takk :)`;
    try {
      await sendmail({
        to: toArchiveAdministrator,
        subject: "Arkiveringsroboten har funnet duplikate virksomheter i P360",
        body: mailStrBlock
      });
    } catch (error) {
      logger.errorException(error, "syncEnterprise - Sending mail failed when trying to alert about duplicate enterprise with EnterpriseNumber {EnterpriseNumber}", enterprise.EnterpriseNumber);
    }
  }

  let needsChange: boolean = false;
  if (enterpriseRes[0].Name.toLowerCase() !== enterprise.Name.toLowerCase()) {
    needsChange = true;
  }
  if (enterpriseRes[0].PostAddress?.StreetAddress?.toLowerCase() !== enterprise.PostAddress.StreetAddress.toLowerCase()) {
    needsChange = true;
  }
  if (enterpriseRes[0].PostAddress?.ZipCode !== enterprise.PostAddress.ZipCode) {
    needsChange = true;
  }
  if (enterpriseRes[0].OfficeAddress?.StreetAddress?.toLowerCase() !== enterprise.OfficeAddress.StreetAddress.toLowerCase()) {
    needsChange = true;
  }
  if (enterpriseRes[0].OfficeAddress?.ZipCode !== enterprise.OfficeAddress.ZipCode) {
    needsChange = true;
  }
  if (Array.isArray(enterpriseRes[0].Categories) && enterpriseRes[0].Categories.includes("recno:1")) {
    needsChange = false; // Dersom det er en intern virksomhet, ikke gjør noe
  }

  result.recno = enterpriseRes[0].Recno;

  if (needsChange) {
    const payload: CallArchiveInput = {
      service: "ContactService",
      method: "UpdateEnterprise",
      parameter: {
        Recno: enterpriseRes[0].Recno,
        ...enterprise
      }
    };

    result.updated = true;
    result.recno = (await callArchive(payload)) as SIFRecnoResponse["Recno"];
  }

  return result;
};

export { syncEnterprise };
