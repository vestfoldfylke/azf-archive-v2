module.exports = {
  archiveTemplate: (archiveData) => {
    return {
      service: "ProjectService",
      method: "GetProjects",
      parameter: {
        Title: "Personaldokumentasjon%",
        ContactReferenceNumber: archiveData.ssn,
        IncludeProjectContacts: true,
        StatusCode: "Under utføring"
      }
    };
  },
  requiredFields: {
    ssn: "01010101010"
  }
};
