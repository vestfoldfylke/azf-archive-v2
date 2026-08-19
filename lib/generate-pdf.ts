import { PDF_GENERATOR } from "../config.js";
import type { TemplateData } from "../types/template.js";
import { requestJson } from "./request-json.js";

const generatePdf = async (pdfData: TemplateData): Promise<string> => {
  const data = (await requestJson(PDF_GENERATOR.url as string, {
    method: "POST",
    body: pdfData,
    headers: { "x-functions-key": PDF_GENERATOR.key as string }
  })) as { data: { base64: string } };
  return data.data.base64;
};

export default generatePdf;
