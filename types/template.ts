export type ArchivePayload = {
  service: string;
  method: string;
  parameter: Record<string, unknown>;
  options?: {
    limit: number;
  };
};

export type PdfPayload = {
  system: string;
  template: string;
  language: "nb" | "nn" | "en";
  type: "1" | "2";
  version: "A" | "B";
  data: Record<string, unknown>;
};

export type PdfResponse = {
  data: {
    base64: string;
  };
};

// biome-ignore lint/suspicious/noExplicitAny: TemplateData is a combination of strings, objects, arrays, numbers. It can be anything...
export type TemplateData = { [key: string]: any };

export type Template = {
  pdfTemplate?: (pdfData: TemplateData) => PdfPayload;
  archiveTemplate: (archiveData: TemplateData) => ArchivePayload;
  requiredFields: TemplateData;
  optionalFields?: Record<string, string>;
};

export type ValidatedTemplateResponse = {
  valid: boolean;
  errorProperties: string[];
};
