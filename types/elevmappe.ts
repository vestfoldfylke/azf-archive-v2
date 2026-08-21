export type Name = {
  firstName?: string;
  lastName?: string;
  fullName?: string;
};

export type SyncElevmappeBody = {
  ssn?: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  birthdate?: string;
  fakeSsn?: boolean;
  gender?: string;
  streetAddress?: string;
  zipCode?: string;
  zipPlace?: string;
  email?: string;
  phoneNumber?: string;
  forceUpdate?: boolean;
  manualData?: boolean;
};

export type SyncPrivatePersonMethod = "fakessn" | "ssn" | "namebirthdate";

export type SyncPrivatePersonResponse = {
  ssn: string;
  name: string | null;
  firstName: string | null;
  lastName: string | null;
  streetAddress: string | null;
  zipCode: string | null;
  zipPlace: string | null;
  addressProtection: boolean | null;
  email: string | null;
  phoneNumber: string | null;
  recno: string | null;
  updated: boolean | null;
  created: boolean | null;
};
