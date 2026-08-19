export type LegacyContext = {
  invocationId?: string;
  log?: (...args: unknown[]) => void;
  [key: string]: unknown;
};

export type LegacyRequest = {
  headers: Record<string, string | undefined>;
  body?: Record<string, unknown>;
};

export type LegacyResponse = {
  status: number;
  body: unknown;
};

export type DecodedAccess = {
  verified: boolean;
  msg: string | null;
  roles: string[];
  appid?: string;
  upn?: string;
};
