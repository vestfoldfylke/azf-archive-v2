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

/** ContactService / GetPrivatePersons */
export type SIFGetPrivatePersonsResponse = Partial<SIFBaseResponse> & {
  PrivatePersons: SIFPrivatePersonResult[];
};

/** ContactService / SynchronizePrivatePerson */
export type SIFRecnoResponse = Partial<SIFBaseResponse> & {
  Recno: string;
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
