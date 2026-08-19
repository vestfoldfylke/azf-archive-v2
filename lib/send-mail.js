const { logger } = require("@vtfk/logger");
const {
  MAIL: { bcc, cc, from, signature, url, secret, templateName }
} = require("../config.js");
const { requestJson } = require("./request-json.js");

module.exports = async (options, context) => {
  const { to, subject, body } = options;
  const payload = {
    to,
    from,
    subject,
    template: {
      templateName,
      templateData: {
        body,
        signature
      }
    }
  };
  if (cc) payload.cc = cc;
  if (bcc) payload.bcc = bcc;
  try {
    const data = await requestJson(url, {
      method: "POST",
      body: payload,
      headers: { "x-functions-key": secret }
    });
    logger("info", ["send-mail", "mail sent", "to", payload.to, "cc", cc, "bcc", bcc], context);
    return data;
  } catch (error) {
    logger("error", ["send-mail", "failed to send mail", "to", payload.to, "cc", cc, "bcc", bcc, error.data || error.stack || error.toString()], context);
    return null;
  }
};
