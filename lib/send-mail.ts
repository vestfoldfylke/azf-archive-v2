import { logger } from "@vestfoldfylke/loglady";
import { MAIL } from "../config.js";
import HTTPError from "./http-error.js";
import { requestJson } from "./request-json.js";

type MailOptions = { to: string | string[]; subject: string; body: string };

const { bcc, cc, from, signature, url, secret, templateName } = MAIL;

export default async (options: MailOptions): Promise<unknown> => {
  const { to, subject, body } = options;
  const payload: Record<string, unknown> = {
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
    const data = await requestJson(url as string, {
      method: "POST",
      body: payload,
      headers: { "x-functions-key": secret as string }
    });
    logger.info("send-mail - mail sent - to - {@To} - cc - {@Cc} - bcc - {@Bcc}", to, cc, bcc);
    return data;
  } catch (error) {
    if (error instanceof HTTPError) {
      logger.errorException(error, "send-mail - failed to send mail - to - {@To} - cc - {@Cc} - bcc - {@Bcc} - Data: {@Data}", to, cc, bcc, error.data as object);
      return null;
    }

    logger.errorException(error, "send-mail - failed to send mail - to - {@To} - cc - {@Cc} - bcc - {@Bcc}", to, cc, bcc);
    return null;
  }
};
