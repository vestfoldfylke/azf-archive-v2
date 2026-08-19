const { FREG } = require("../config.js");
const { getToken } = require("./get-entra-id-token.js");
const HTTPError = require("./http-error.js");
const { requestJson } = require("./request-json.js");

const authHeader = async () => ({ Authorization: `Bearer ${await getToken(FREG.scope)}` });

const fregSsn = async (ssn) => {
  const data = await requestJson(FREG.url, {
    method: "POST",
    body: { ssn },
    headers: await authHeader()
  });
  if (!data.foedselsEllerDNummer) throw new Error(`Could not find anyone with that ssn ${ssn}, did someone prank you?`);
  return data;
};

const fregNameBirthdate = async (name, birthdate) => {
  const dateList = birthdate.split("-");
  if (!dateList.length === 3) throw new HTTPError(400, "birthdate must be on the format YYYY-MM-DD");
  const fregbirthdate = birthdate.replaceAll("-", "");
  const data = await requestJson(FREG.url, {
    method: "POST",
    body: { name, birthdate: fregbirthdate },
    headers: await authHeader()
  });
  if (!data.foedselsEllerDNummer) throw new Error("Could not find unique match on that name and birthdate");
  return data;
};

module.exports = { fregSsn, fregNameBirthdate };
