import type { ArchivePayload, Template, TemplateData } from "../../types/template.js";

const template: Template = {
  archiveTemplate: (archiveData: TemplateData): ArchivePayload => {
    return {
      service: "ContactService",
      method: "GetContactPersons",
      parameter: {
        Email: archiveData.email,
        Active: "true"
      }
    };
  },
  requiredFields: {
    email: "hubbabubba@hubben.com"
  }
};

export default template;
