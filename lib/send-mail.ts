import { logger } from "@vestfoldfylke/loglady";
import { MAIL } from "../config.js";
import { requestJson } from "./request-json.js";

type MailOptions = { to: string | string[]; subject: string; body: string };

const { bcc, cc, from, signature, url, secret, templateName } = MAIL;

export default async (options: MailOptions, _context?: unknown): Promise<unknown> => {
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
    logger.info(`send-mail - mail sent - to - ${payload.to} - cc - ${cc} - bcc - ${bcc}`);
    return data;
  } catch (error) {
    const err = error as { data?: unknown; stack?: string; toString: () => string };
    logger.error(`send-mail - failed to send mail - to - ${payload.to} - cc - ${cc} - bcc - ${bcc} - ${err.data || err.stack || err.toString()}`);
    return null;
  }
};
