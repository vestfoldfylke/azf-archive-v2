import type { ArchivePayload, Template, TemplateData } from "../../types/template.js";

const template: Template = {
  archiveTemplate: (archiveData: TemplateData): ArchivePayload => {
    return {
      service: "ProjectService",
      method: "UpdateProject",
      parameter: {
        ProjectNumber: archiveData.projectNumber,
        Title: archiveData.projectTitle,
        ResponsiblePersonEmail: archiveData.responsiblePersonEmail
      }
    };
  },
  requiredFields: {
    projectNumber: "00-00",
    projectTitle: "Test prosjekt-tittel",
    responsiblePersonEmail: "Nordmann@no.no"
  }
};

export default template;
