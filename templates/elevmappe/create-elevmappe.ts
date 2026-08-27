import { ARCHIVE_ROBOT } from "../../config.js";

import type { ArchivePayload, Template, TemplateData } from "../../types/template.js";

const template: Template = {
  archiveTemplate: (archiveData: TemplateData): ArchivePayload => {
    return {
      service: "CaseService",
      method: "CreateCase",
      parameter: {
        CaseType: "Elev",
        Title: "Elevmappe",
        UnofficialTitle: `Elevmappe - ${archiveData.firstName} ${archiveData.lastName}`,
        Status: "B",
        JournalUnit: "Sentralarkiv",
        SubArchive: "Elev",
        ArchiveCodes: [
          {
            ArchiveCode: archiveData.ssn,
            ArchiveType: "FNR",
            Sort: 1,
            IsManualText: true
          },
          {
            ArchiveCode: "B31",
            ArchiveType: "FAGKLASSE PRINSIPP",
            Sort: 2
          }
        ],
        AccessCode: "13",
        Paragraph: "Offl. § 13 jf. fvl. § 13 (1) nr.1",
        AccessGroup: ARCHIVE_ROBOT.accessGroup,
        ResponsibleEnterpriseRecno: ARCHIVE_ROBOT.departmentRecno,
        ResponsiblePersonRecno: ARCHIVE_ROBOT.recno,
        Contacts: [
          {
            Role: "Sakspart",
            ReferenceNumber: `recno:${archiveData.recno}`,
            IsUnofficial: true
          }
        ]
      }
    };
  },
  requiredFields: {
    firstName: "Ola",
    lastName: "Nordmann",
    ssn: "01010101010",
    recno: 12345
  }
};

export default template;
