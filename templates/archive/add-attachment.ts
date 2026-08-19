import type { ArchivePayload, Template, TemplateData } from "../../types/template.js";

const template: Template = {
  archiveTemplate: (archiveData: TemplateData): ArchivePayload => {
    return {
      service: "DocumentService",
      method: "UpdateDocument",
      parameter: {
        DocumentNumber: archiveData.documentNumber,
        Files: [
          {
            Base64Data: archiveData.base64,
            Format: archiveData.format,
            Status: "F",
            Title: archiveData.title,
            VersionFormat: archiveData.versionFormat
          }
        ]
      }
    };
  },
  requiredFields: {
    documentNumber: "30/00000-12",
    base64: "fhdjfhoidshfdsfkjdsb",
    format: "docx",
    title: "En flott fil",
    versionFormat: "P"
  }
};

export default template;
