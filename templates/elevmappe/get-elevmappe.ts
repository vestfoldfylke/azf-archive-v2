import type { ArchivePayload, Template, TemplateData } from "../../types/template.js";

const template: Template = {
  archiveTemplate: (archiveData: TemplateData): ArchivePayload => {
    return {
      service: "CaseService",
      method: "GetCases",
      parameter: {
        Title: "Elevmappe%",
        ContactReferenceNumber: archiveData.ssn,
        IncludeCaseContacts: true
      }
    };
  },
  requiredFields: {
    ssn: "12345678910"
  }
};

export default template;
