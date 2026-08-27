export type Name = {
  firstName: string;
  lastName: string;
  fullName: string;
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
