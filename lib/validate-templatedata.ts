import { GENERATED_PDF_PROPERTY_NAME } from "../config.js";
import flattenObject from "./flatten-object.js";

const reservedPropertyNames = [GENERATED_PDF_PROPERTY_NAME];

export default (requiredFields: Record<string, unknown>, parameter: Record<string, unknown>, system: string, template: string): { valid: boolean; errorProperties: string[] } => {
  for (const reserved of reservedPropertyNames) {
    if (requiredFields[reserved]) {
      throw new Error(`"${reserved}" is a reserved propertyname in "requiredFields", please use something else in the template: ${system}-${template}`);
    }
  }
  const errorProperties: string[] = [];
  const flattenedParameter = flattenObject(parameter, { prefix: "parameter.", flattenArray: true });
  for (const [key, value] of Object.entries(flattenObject(requiredFields, { prefix: "parameter.", flattenArray: true }))) {
    if (!Object.hasOwn(flattenedParameter, key)) {
      errorProperties.push(`Property { ${key} } [${Array.isArray(value) ? "array" : typeof value}] is missing`);
    } else if (typeof value !== typeof flattenedParameter[key]) {
      errorProperties.push(`Property { ${key} } must be of type [${typeof value}]. Received [${typeof flattenedParameter[key]}]`);
    }
  }
  return { valid: errorProperties.length === 0, errorProperties };
};
