export type TemplateData = Record<string, unknown>;

export type ArchivePayload = {
  service: string;
  method: string;
  parameter: Record<string, unknown>;
};

export type PdfPayload = Record<string, unknown>;

export type Template = {
  pdfTemplate?: (pdfData: TemplateData) => PdfPayload;
  archiveTemplate: (archiveData: TemplateData) => ArchivePayload;
  requiredFields: TemplateData;
  optionalFields?: TemplateData;
};
