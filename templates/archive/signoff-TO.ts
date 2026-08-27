import type { ArchivePayload, Template, TemplateData } from "../../types/template.js";

const template: Template = {
  archiveTemplate: (archiveData: TemplateData): ArchivePayload => {
    return {
      service: "DocumentService",
      method: "SignOffDocument",
      parameter: {
        Document: archiveData.documentNumber,
        ResponseCode: "TO",
        Note: "Dokumentet er avskrevet med koden TO – Tatt til orientering"
      }
    };
  },
  requiredFields: {
    documentNumber: "30/00000-1"
  }
};

export default template;
