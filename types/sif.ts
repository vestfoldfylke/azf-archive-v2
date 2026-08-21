export type SIFBaseResponse = {
  ErrorDetails?: string | null;
  ErrorMessage?: string | null;
  Successful: boolean;
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
  Recno: string;
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
  CaseNumber: string;
  Recno: string;
  Status?: string;
  Title: string;
  UnofficialTitle: string;
  Contacts?: SIFCaseContact[];
};

export type SIFCaseContact = {
  Address: SIFAddress;
  ContactName: string;
  ContactType: string;
  ExternalId: string;
  IsUnofficial: boolean;
  Notes?: string;
  Recno: string;
  ReferenceNumber: string;
  Role: string;
  SubjectArea?: string;
};

export type SIFPrivatePersonResult = {
  Recno: string;
  FirstName: string;
  LastName: string;
  PersonalIdNumber: string;
  ExternalID: string;
  Email: string;
  PhoneNumber: string;
  MobilePhone: string;
  PrivateAddress: SIFAddress;
};
