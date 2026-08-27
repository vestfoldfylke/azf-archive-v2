import type { ArchivePayload, Template, TemplateData } from "../../types/template.js";

const template: Template = {
  archiveTemplate: (archiveData: TemplateData): ArchivePayload => {
    return {
      service: "DocumentService",
      method: "UpdateDocument",
      parameter: {
        DocumentNumber: archiveData.documentNumber,
        Status: "U"
      }
    };
  },
  requiredFields: {
    documentNumber: "30/00000-12"
  }
};

export default template;
