import assert from "node:assert/strict";
import { lstatSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { describe, test } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";
import { GENERATED_PDF_PROPERTY_NAME } from "../config.js";
import flattenObject from "../lib/flatten-object.js";
import type { Template } from "../types/template.js";

const here: string = dirname(fileURLToPath(import.meta.url));
const templatesRoot: string = join(here, "..", "templates");

const systems: string[] = readdirSync(templatesRoot).filter((ele) => lstatSync(join(templatesRoot, ele)).isDirectory());

const validateFields = (flattenedFields: Record<string, unknown>, type: "archive" | "pdf", requiredFields: Record<string, unknown>): string => {
  const requiredKeys: string[] = Object.keys(requiredFields);

  for (const [key, value] of Object.entries(flattenedFields)) {
    if (requiredKeys.includes(key) && (value === undefined || value === null)) {
      return `Oh shait, ${key} has null or undefined value... Please fix template...`;
    }

    if (typeof value === "string" && value.includes("undefined")) {
      return `Oh shait, ${key} has null or undefined value... Please fix template...`;
    }
  }

  if (type === "archive") {
    if (!flattenedFields.service) {
      return 'Whops, did you forget to add "service" to archiveTemplate?';
    }

    if (!flattenedFields.method) {
      return 'Whops, did you forget to add "method" to archiveTemplate?';
    }
  }

  if (type === "pdf") {
    if (!flattenedFields.system) {
      return 'Whops, did you forget to add "system" to pdfTemplate?';
    }

    if (!flattenedFields.template) {
      return 'Whops, did you forget to add "template" to pdfTemplate?';
    }
  }

  return "Okidoki!";
};

for (const system of systems) {
  describe(`Verifying templates for system: "${system}"`, () => {
    const templates: string[] = readdirSync(join(templatesRoot, system)).filter((f) => f.endsWith(".js") || f.endsWith(".ts"));

    for (const template of templates) {
      test(`Expect template "${template}" to generate successfully`, async () => {
        const modulePath: string = pathToFileURL(join(templatesRoot, system, template)).href;
        const module = (await import(modulePath)) as { default: Template };
        const { pdfTemplate, archiveTemplate, requiredFields } = module.default;

        if (pdfTemplate) {
          const pdfValidation: string = validateFields(flattenObject(pdfTemplate(requiredFields) as Record<string, unknown>, { flattenArray: true }), "pdf", requiredFields);
          assert.equal(pdfValidation, "Okidoki!");
          requiredFields[GENERATED_PDF_PROPERTY_NAME] = "base64base64blablabla==";
        }

        const archiveValidation: string = validateFields(flattenObject(archiveTemplate(requiredFields) as unknown as Record<string, unknown>, { flattenArray: true }), "archive", requiredFields);
        assert.equal(archiveValidation, "Okidoki!");
      });
    }
  });
}
