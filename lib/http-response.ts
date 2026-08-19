import type { HttpResponseInit } from "@azure/functions";
import HTTPError from "./http-error.js";

const httpResponse = (statuscode: number, data: unknown): HttpResponseInit => {
  if (!statuscode) throw new Error('Missing required parameter "statuscode"');
  if (data === undefined || data === null) throw new Error('Missing required parameter "data"');
  if (statuscode === 200) return { status: statuscode, jsonBody: data };

  if (data instanceof HTTPError) {
    return { status: data.statusCode, jsonBody: { message: data.message, data: data.data } };
  }

  if (data instanceof Error) {
    const error = data.stack || data.toString();
    const message = data.toString();
    return { status: statuscode, jsonBody: { message, data: error } };
  }

  if (typeof data === "string") return { status: statuscode, jsonBody: { message: data, data: null } };

  return { status: statuscode, jsonBody: data };
};

export { httpResponse };
