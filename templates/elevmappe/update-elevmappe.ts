import type { ArchivePayload, Template, TemplateData } from "../../types/template.js";

const template: Template = {
  archiveTemplate: (archiveData: TemplateData): ArchivePayload => {
    return {
      service: "CaseService",
      method: "UpdateCase",
      parameter: {
        CaseNumber: archiveData.caseNumber,
        Title: "Elevmappe",
        UnofficialTitle: `Elevmappe - ${archiveData.firstName} ${archiveData.lastName}`,
        Contacts: [
          {
            Role: "Sakspart",
            ReferenceNumber: `recno:${archiveData.recno}`,
            IsUnofficial: true
          }
        ],
        SyncCaseContacts: true
      }
    };
  },
  requiredFields: {
    caseNumber: "30/00000",
    firstName: "Per",
    lastName: "Son",
    recno: 12345
  }
};

export default template;
