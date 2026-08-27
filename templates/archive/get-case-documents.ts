import type { ArchivePayload, Template, TemplateData } from "../../types/template.js";

const template: Template = {
  archiveTemplate: (archiveData: TemplateData): ArchivePayload => {
    return {
      service: "DocumentService",
      method: "GetDocuments",
      parameter: {
        CaseNumber: archiveData.caseNumber,
        IncludeAccessMatrixRowPermissions: true
      }
    };
  },
  requiredFields: {
    caseNumber: "30/00000"
  }
};

export default template;
