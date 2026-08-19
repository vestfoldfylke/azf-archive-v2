import HTTPError from "./http-error.js";

type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  headers?: Record<string, string>;
};

const parseBody = async (response: Response): Promise<unknown> => {
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

const requestJson = async (url: string, options: RequestOptions = {}): Promise<unknown> => {
  const { method = "GET", body, headers = {} } = options;
  const init: RequestInit & { headers: Record<string, string> } = {
    method,
    headers: { Accept: "application/json", ...headers }
  };
  if (body !== undefined) {
    init.body = typeof body === "string" ? body : JSON.stringify(body);
    if (!init.headers["Content-Type"] && !init.headers["content-type"]) {
      init.headers["Content-Type"] = "application/json";
    }
  }

  const response = await fetch(url, init);
  const parsed = await parseBody(response);
  if (!response.ok) {
    const message = typeof parsed === "string" ? parsed || response.statusText : response.statusText;
    throw new HTTPError(response.status, message, parsed);
  }
  return parsed;
};

export { requestJson };
