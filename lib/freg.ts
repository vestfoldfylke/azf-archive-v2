import { FREG } from "../config.js";
import { getToken } from "./get-entra-id-token.js";
import HTTPError from "./http-error.js";
import { requestJson } from "./request-json.js";

type FregResponse = { foedselsEllerDNummer?: string; [key: string]: unknown };

const authHeader = async (): Promise<Record<string, string>> => ({ Authorization: `Bearer ${await getToken(FREG.scope)}` });

const fregSsn = async (ssn: string): Promise<FregResponse> => {
  const data = (await requestJson(FREG.url, {
    method: "POST",
    body: { ssn },
    headers: await authHeader()
  })) as FregResponse;
  if (!data.foedselsEllerDNummer) throw new Error(`Could not find anyone with that ssn ${ssn}, did someone prank you?`);
  return data;
};

const fregNameBirthdate = async (name: string, birthdate: string): Promise<FregResponse> => {
  const dateList = birthdate.split("-");
  if (dateList.length !== 3) throw new HTTPError(400, "birthdate must be on the format YYYY-MM-DD");
  const fregbirthdate = birthdate.replaceAll("-", "");
  const data = (await requestJson(FREG.url, {
    method: "POST",
    body: { name, birthdate: fregbirthdate },
    headers: await authHeader()
  })) as FregResponse;
  if (!data.foedselsEllerDNummer) throw new Error("Could not find unique match on that name and birthdate");
  return data;
};

export { fregNameBirthdate, fregSsn };
