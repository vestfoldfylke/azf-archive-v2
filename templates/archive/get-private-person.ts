import type { ArchivePayload, Template, TemplateData } from "../../types/template.js";

const template: Template = {
  archiveTemplate: (archiveData: TemplateData): ArchivePayload => {
    return {
      service: "ContactService",
      method: "GetPrivatePersons",
      parameter: {
        PersonalIdNumber: archiveData.ssn,
        Active: "true"
      }
    };
  },
  requiredFields: {
    ssn: "01010101010"
  }
};

export default template;
