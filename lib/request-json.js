const HTTPError = require("./http-error.js");

const parseBody = async (response) => {
  const raw = await response.text();
  if (!raw) return null;
  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) return raw;
  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
};

const requestJson = async (url, { method = "GET", body, headers = {}, dispatcher } = {}) => {
  const init = { method, headers: { Accept: "application/json", ...headers } };
  if (body !== undefined) {
    init.body = typeof body === "string" ? body : JSON.stringify(body);
    if (!init.headers["Content-Type"] && !init.headers["content-type"]) {
      init.headers["Content-Type"] = "application/json";
    }
  }
  if (dispatcher) init.dispatcher = dispatcher;

  const response = await fetch(url, init);
  const parsed = await parseBody(response);
  if (!response.ok) {
    throw new HTTPError(response.status, typeof parsed === "string" ? parsed || response.statusText : response.statusText, parsed);
  }
  return parsed;
};

module.exports = { requestJson };
