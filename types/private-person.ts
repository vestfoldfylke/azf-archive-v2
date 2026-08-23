import type { SyncElevmappeBody } from "./elevmappe.js";

export type RepackedBirthdate = {
  regular: string;
  fakeSsn: string;
};

export type SyncPrivatePersonBody = SyncElevmappeBody;

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
  recno: number | null;
  updated: boolean | null;
  created: boolean | null;
};
