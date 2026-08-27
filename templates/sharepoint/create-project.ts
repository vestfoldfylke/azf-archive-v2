import type { ArchivePayload, Template, TemplateData } from "../../types/template.js";

const template: Template = {
  archiveTemplate: (archiveData: TemplateData): ArchivePayload => {
    return {
      service: "ProjectService",
      method: "CreateProject",
      parameter: {
        Title: archiveData.projectTitle,
        ResponsiblePersonEmail: archiveData.responsiblePersonEmail
      }
    };
  },
  requiredFields: {
    projectTitle: "Test prosjekt-tittel",
    responsiblePersonEmail: "Nordmann@no.no"
  }
};

export default template;
