import type { HttpResponseInit } from "@azure/functions";
import HTTPError from "./http-error.js";

const httpResponse = (statusCode: number, data: unknown): HttpResponseInit => {
  if (!statusCode) {
    throw new Error('Missing required parameter "statusCode"');
  }
  if (data === undefined || data === null) {
    throw new Error('Missing required parameter "data"');
  }

  if (statusCode === 200) {
    return {
      status: statusCode,
      jsonBody: data
    };
  }

  if (data instanceof HTTPError) {
    return {
      status: data.statusCode,
      jsonBody: {
        message: data.message,
        data: data.data
      }
    };
  }

  if (data instanceof Error) {
    const error: string = data.stack || data.toString();
    const message: string = data.toString();
    return {
      status: statusCode,
      jsonBody: {
        message,
        data: error
      }
    };
  }

  if (typeof data === "string") {
    return {
      status: statusCode,
      jsonBody: {
        message: data,
        data: null
      }
    };
  }

  return {
    status: statusCode,
    jsonBody: data
  };
};

export { httpResponse };
