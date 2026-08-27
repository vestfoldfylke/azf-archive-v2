import type { ArchivePayload, Template, TemplateData } from "../../types/template.js";

const template: Template = {
  archiveTemplate: (archiveData: TemplateData): ArchivePayload => {
    return {
      service: "DocumentService",
      method: "GetDocuments",
      parameter: {
        DocumentNumber: archiveData.documentNumber
      }
    };
  },
  requiredFields: {
    documentNumber: "et dokumentnummer"
  }
};

export default template;
