import { logger } from "@vestfoldfylke/loglady";
import { MAIL } from "../config.js";
import HTTPError from "./http-error.js";
import { requestJson } from "./request-json.js";

type MailBody = {
  to: MailOptions["to"];
  cc?: string[];
  bcc?: string[];
  from: string;
  subject: string;
  template: {
    templateName: string;
    templateData: {
      body: MailOptions["body"];
      signature: typeof MAIL.signature;
    };
  };
};

type MailOptions = {
  to: string | string[];
  subject: string;
  body: string;
};

const { bcc, cc, from, signature, url, secret, templateName } = MAIL;

export default async (options: MailOptions): Promise<void> => {
  const { to, subject, body } = options;
  const payload: MailBody = {
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

  if (cc.length > 0) {
    payload.cc = cc;
  }
  if (bcc.length > 0) {
    payload.bcc = bcc;
  }

  try {
    await requestJson(url, {
      method: "POST",
      body: payload,
      headers: {
        "x-functions-key": secret
      }
    });

    logger.info("send-mail - mail sent - to - {@To} - cc - {@Cc} - bcc - {@Bcc}", to, cc, bcc);
  } catch (error) {
    if (error instanceof HTTPError) {
      logger.errorException(error, "send-mail - failed to send mail - to - {@To} - cc - {@Cc} - bcc - {@Bcc} - Data: {@Data}", to, cc, bcc, error.data as object);
      return;
    }

    logger.errorException(error, "send-mail - failed to send mail - to - {@To} - cc - {@Cc} - bcc - {@Bcc}", to, cc, bcc);
  }
};
