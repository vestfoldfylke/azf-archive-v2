import { GENERATED_PDF_PROPERTY_NAME } from "../config.js";
import type { ArchivePayload, TemplateData, ValidatedTemplateResponse } from "../types/template.js";
import flattenObject from "./flatten-object.js";

const reservedPropertyNames: string[] = [GENERATED_PDF_PROPERTY_NAME];

export default (requiredFields: TemplateData, parameter: ArchivePayload["parameter"], system: string, template: string): ValidatedTemplateResponse => {
  for (const reserved of reservedPropertyNames) {
    if (requiredFields[reserved]) {
      throw new Error(`"${reserved}" is a reserved property name in "requiredFields", please use something else in the template: ${system}-${template}`);
    }
  }

  const errorProperties: string[] = [];
  const flattenedParameter: Record<string, unknown> = flattenObject(parameter, { prefix: "parameter.", flattenArray: true });

  for (const [key, value] of Object.entries(flattenObject(requiredFields, { prefix: "parameter.", flattenArray: true }))) {
    if (!Object.hasOwn(flattenedParameter, key)) {
      errorProperties.push(`Property { ${key} } [${Array.isArray(value) ? "array" : typeof value}] is missing`);
    } else if (typeof value !== typeof flattenedParameter[key]) {
      errorProperties.push(`Property { ${key} } must be of type [${typeof value}]. Received [${typeof flattenedParameter[key]}]`);
    }
  }

  return { valid: errorProperties.length === 0, errorProperties };
};
