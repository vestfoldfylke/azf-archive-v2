import type { ArchivePayload, Template, TemplateData } from "../../types/template.js";

const template: Template = {
  archiveTemplate: (archiveData: TemplateData): ArchivePayload => {
    return {
      service: "ProjectService",
      method: "GetProjects",
      parameter: {
        Title: "Personaldokumentasjon%",
        ContactReferenceNumber: archiveData.ssn,
        IncludeProjectContacts: true,
        StatusCode: "Under utføring"
      }
    };
  },
  requiredFields: {
    ssn: "01010101010"
  }
};

export default template;
