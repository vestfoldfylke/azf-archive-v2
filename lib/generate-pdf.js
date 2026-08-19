const {
  PDF_GENERATOR: { url, key }
} = require("../config.js");
const { requestJson } = require("./request-json.js");

module.exports = async (pdfData) => {
  const data = await requestJson(url, {
    method: "POST",
    body: pdfData,
    headers: { "x-functions-key": key }
  });
  return data.data.base64;
};
