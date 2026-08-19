import type { ArchivePayload, Template, TemplateData } from "../../types/template.js";

const template: Template = {
  archiveTemplate: (archiveData: TemplateData): ArchivePayload => {
    return {
      service: "ContactService",
      method: "GetEnterprises",
      parameter: {
        EnterpriseNumber: archiveData.orgnr,
        Active: "true"
      }
    };
  },
  requiredFields: {
    orgnr: "01010101010"
  }
};

export default template;
