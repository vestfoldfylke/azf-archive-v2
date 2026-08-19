import type { ArchivePayload, Template, TemplateData } from "../../types/template.js";

const template: Template = {
  archiveTemplate: (archiveData: TemplateData): ArchivePayload => {
    return {
      service: "CaseService",
      method: "GetCases",
      parameter: {
        ExternalID: {
          Id: archiveData.caseExternalId,
          Type: "SharePoint Case"
        }
      },
      options: {
        limit: 1
      }
    };
  },
  requiredFields: {
    caseExternalId: "unique id"
  }
};

export default template;
