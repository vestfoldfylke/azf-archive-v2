import type { BrregEnhetRepacked } from "./brreg.js";

export type SyncEnterpriseBody = {
  orgnr?: string;
};

export type SyncEnterpriseResponse = BrregEnhetRepacked & {
  recno: number;
  updated: boolean;
  created: boolean;
};
