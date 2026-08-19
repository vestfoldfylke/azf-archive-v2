import HTTPError from "./http-error.js";

const httpResponse = (statuscode, data) => {
  if (!statuscode) throw new Error('Missing required parameter "statuscode"');
  if (!data) throw new Error('Missing required parameter "data"');
  if (statuscode === 200) return { status: statuscode, body: data };

  if (data instanceof HTTPError) {
    return { status: data.statusCode, body: { message: data.message, data: data.data } };
  }

  if (data instanceof Error) {
    const status = statuscode;
    const error = data.stack || data.toString();
    const message = data.toString();
    return { status, body: { message, data: error } };
  }

  if (typeof data === "string") return { status: statuscode, body: { message: data, data: null } };

  return { status: statuscode, body: data };
};

export { httpResponse };
