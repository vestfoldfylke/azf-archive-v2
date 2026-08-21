import type { SIFGetPrivatePersonsResponse, SIFOptions } from "./sif.js";

export type CallArchiveInput = {
  service: string;
  method: string;
  parameter: Record<string, unknown>;
  options?: SIFOptions;
};

export type CallArchiveTemplateInput = {
  system: string;
  template: string;
  parameter: Record<string, unknown>;
  getExample?: boolean;
  demoRun?: boolean;
};

export type FakeSsnResponse = {
  resultFakeSsn: string | undefined;
  privatePersonResult: SIFGetPrivatePersonsResponse["PrivatePersons"];
};
