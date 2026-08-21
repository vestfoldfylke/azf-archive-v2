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

export type CallArchiveInput = {
  service: string;
  method: string;
  parameter: Record<string, unknown>;
  options?: SIFOptions;
};

//CallArchiveTemplateBaseInput & {
export type CallArchiveTemplateInput = {
  system: string;
  template: string;
  parameter: Record<string, unknown>;
  getExample?: boolean;
  demoRun?: boolean;
};
