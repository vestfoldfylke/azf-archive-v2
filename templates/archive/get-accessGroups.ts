import type { ArchivePayload, Template } from "../../types/template.js";

const template: Template = {
  archiveTemplate: (): ArchivePayload => {
    return {
      service: "AccessGroupService",
      method: "GetAccessGroups",
      parameter: {
        IncludeMembers: false,
        MaxRows: 3000
      }
    };
  },
  requiredFields: {}
};

export default template;
