export type SIFBaseResponse = {
  ErrorDetails?: string | null;
  ErrorMessage?: string | null;
  Successful?: boolean;
  TotalCount?: number;
  TotalPageCount?: number;
  NextDeltaLastDate?: string;
};

export type SIFRawResponse = SIFBaseResponse & {
  [key: string]: unknown;
};

export type SIFOptions = {
  limit?: number;
  onlyOpenCases?: boolean;
  excludeExpiredCases?: boolean;
  [key: string]: unknown;
};

// callArchiveTemplate and callArchive responses

/** CaseService / GetCases */
export type SIFCasesResponse = Partial<SIFBaseResponse> & {
  Cases: SIFCase[];
};

/** ContactService / GetPrivatePersons */
export type SIFGetPrivatePersonsResponse = Partial<SIFBaseResponse> & {
  PrivatePersons: SIFPrivatePersonResult[];
};

/** General response which only returns a Recno */
export type SIFRecnoResponse = Partial<SIFBaseResponse> & {
  Recno: number;
};

/** General response which returns a Recno and a CaseNumber */
export type SIFRecnoAndCaseNumberResponse = SIFRecnoResponse & {
  CaseNumber: string;
};

// types from SIF documentation used in responses above

export type SIFAddress = {
  StreetAddress: string;
  ZipCode: string;
  ZipPlace: string;
  Country: string;
  County: string;
  Area: string;
  State?: string;
};

export type SIFCase = {
  AccessCodeDescription: string;
  AccessCodeCode: string;
  AccessGroup: string;
  ArchiveCodes: string[];
  CaseEstates: null;
  CaseNumber: string;
  CaseRowPermissions: null;
  CaseTypeCode: string;
  CaseTypeDescription: string;
  Contacts?: SIFCaseContact[] | null;
  CreatedDate: string;
  CustomFields: null;
  Date: string;
  Documents: unknown[];
  ExternalId: string | null;
  LastChangedDate: string;
  Notes: string;
  Paragraph: string;
  ProjectRecno: string;
  ProjectName: string;
  ProgressPlan: Record<string, unknown>;
  Recno: number; // TODO: Is Recno a number????
  ReferringCases: null;
  ReferringDocuments: null;
  ResponsibleEnterprise: Record<string, unknown>;
  ResponsibleEnterpriseName: string;
  ResponsiblePerson: Record<string, unknown>;
  ResponsiblePersonName: string;
  SubArchive: string;
  SubArchiveCode: string;
  SubjectSpecificMetaData: null;
  SubjectSpecificMetaDataNamespace: null;
  Status?: string;
  Title: string;
  UnofficialTitle: string;
  URL: string;
};

export type SIFCaseContact = {
  Address: SIFAddress;
  ContactName: string;
  ContactType: string;
  ExternalId: string;
  IsUnofficial: boolean;
  Notes?: string;
  Recno: number;
  ReferenceNumber: string;
  Role: string;
  SubjectArea?: string;
};

export type SIFPrivatePersonResult = {
  Recno: number;
  FirstName: string;
  LastName: string;
  PersonalIdNumber: string;
  ExternalID: string;
  Email: string;
  PhoneNumber: string;
  MobilePhone: string;
  PrivateAddress: SIFAddress;
};
