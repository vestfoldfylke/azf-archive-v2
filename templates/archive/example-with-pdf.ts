import { GENERATED_PDF_PROPERTY_NAME } from "../../config.js"; // THIS LINE IS REQUIRED IF YOU NEED PDF GENERATION IN THE TEMPLATE
import type { ArchivePayload, PdfPayload, Template, TemplateData } from "../../types/template.js";

const template: Template = {
  pdfTemplate: (pdfData: TemplateData): PdfPayload => {
    // A pdfTemplate adds GENERATED_PDF_PROPERTY_NAME-property to archiveData, which can be used in the archiveTemplate
    return {
      system: "smart",
      template: "motereferat",
      language: "nb",
      type: "2",
      version: "B",
      data: {
        created: {
          timestamp: Date.now()
        },
        meetingGroup: {
          name: "Hengsrud vinkjeller"
        },
        paragraph: "Offl. § 14",
        title: "Skal vi ha fest på lørran?",
        description: "Dersom vi skal ha fest på lørran må vi ha et sted å ha det",
        decision: pdfData.beslutning
      }
    };
  },
  archiveTemplate: (archiveData: TemplateData): ArchivePayload => {
    return {
      service: "DocumentService",
      method: "GetDocuments",
      parameter: {
        DocumentNumber: archiveData.documentNumber,
        base64data: archiveData[GENERATED_PDF_PROPERTY_NAME] // pdf created by the pdfTemplate (special case and not a required field - because the pdfTemplate handles it)
      }
    };
  },
  requiredFields: {
    documentNumber: "et dokumentnummer",
    beslutning: "en beslutning om no drit"
  }
};

export default template;
