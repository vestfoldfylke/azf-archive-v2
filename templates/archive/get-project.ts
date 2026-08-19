import type { ArchivePayload, Template, TemplateData } from "../../types/template.js";

const template: Template = {
  archiveTemplate: (archiveData: TemplateData): ArchivePayload => {
    return {
      service: "ProjectService",
      method: "GetProjects",
      parameter: {
        ProjectNumber: archiveData.projectNumber
      },
      options: {
        limit: 1
      }
    };
  },
  requiredFields: {
    projectNumber: "23-12"
  }
};

export default template;
