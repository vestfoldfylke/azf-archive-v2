export type SyncEmployeeBody = {
  ssn?: string;
  ansattnummer?: string;
  upn?: string;
  forceUpdate?: boolean;
  manualManagerEmail?: string;
};

export type SyncEmployeeResponse = {
  responsibleEnterprise: ResponsibleEnterpriseRepacked;
  archiveManager: ContactPersonRepacked;
};

export type ContactPersonRepacked = {
  recno: number;
  email: string;
  name: string;
};

export type ResponsibleEnterpriseRepacked = {
  recno: number;
  externalId: string;
  shortName: string;
  name: string;
};
