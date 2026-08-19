// biome-ignore lint/suspicious/noExplicitAny: TemplateData is a combination of strings, objects, arrays, numbers. It can be anything...
export type TemplateData = { [key: string]: any };

export type ArchivePayload = {
  service: string;
  method: string;
  parameter: Record<string, unknown>;
  options?: Record<string, unknown>;
};

export type PdfPayload = Record<string, unknown>;

export type Template = {
  pdfTemplate?: (pdfData: TemplateData) => PdfPayload;
  archiveTemplate: (archiveData: TemplateData) => ArchivePayload;
  requiredFields: TemplateData;
  optionalFields?: Record<string, string>;
};
