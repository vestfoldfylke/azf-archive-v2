export type SIFResponse = {
  Successful?: boolean;
  ErrorMessage?: string | null;
  ErrorDetails?: string | null;
  TotalCount?: number;
  TotalPageCount?: number;
  NextDeltaLastDate?: string;
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
