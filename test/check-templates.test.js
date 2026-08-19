const { describe, test } = require("node:test");
const assert = require("node:assert/strict");
const { readdirSync, lstatSync } = require("node:fs");
const flattenObject = require("../lib/flatten-object.js");
const { GENERATED_PDF_PROPERTY_NAME } = require("../config.js");

const systems = readdirSync("./templates").filter((ele) => lstatSync(`./templates/${ele}`).isDirectory());

const validateFields = (flattenedFields, type, requiredFields) => {
  const requiredKeys = Object.keys(requiredFields);
  for (const [key, value] of Object.entries(flattenedFields)) {
    if (requiredKeys.includes(key) && (value === undefined || value === null)) return `Oh shait, ${key} has null or undefined value... Please fix template...`;
    if (typeof value === "string" && value.includes("undefined")) return `Oh shait, ${key} has null or undefined value... Please fix template...`;
  }
  if (type === "archive") {
    if (!flattenedFields.service) return 'Whops, did you forget to add "service" to archiveTemplate?';
    if (!flattenedFields.method) return 'Whops, did you forget to add "method" to archiveTemplate?';
  }
  if (type === "pdf") {
    if (!flattenedFields.system) return 'Whops, did you forget to add "system" to pdfTemplate?';
    if (!flattenedFields.template) return 'Whops, did you forget to add "template" to pdfTemplate?';
  }
  return "Okidoki!";
};

for (const system of systems) {
  describe(`Verifying templates for system: "${system}"`, () => {
    const templates = readdirSync(`./templates/${system}`);
    for (const template of templates) {
      test(`Expect template "${template}" to generate successfully`, () => {
        const { pdfTemplate, archiveTemplate, requiredFields } = require(`../templates/${system}/${template}`);
        if (pdfTemplate) {
          const pdfValidation = validateFields(flattenObject(pdfTemplate(requiredFields), { flattenArray: true }), "pdf", requiredFields);
          assert.equal(pdfValidation, "Okidoki!");
          requiredFields[GENERATED_PDF_PROPERTY_NAME] = "base64base64blablabla==";
        }
        const archiveValidation = validateFields(flattenObject(archiveTemplate(requiredFields), { flattenArray: true }), "archive", requiredFields);
        assert.equal(archiveValidation, "Okidoki!");
      });
    }
  });
}
