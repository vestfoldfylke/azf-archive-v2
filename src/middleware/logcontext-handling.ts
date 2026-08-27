import type { HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { type LogConfig, logger } from "@vestfoldfylke/loglady";
import { runInContext } from "./async-local-context.js";

export async function logContextHandling(
  request: HttpRequest,
  context: InvocationContext,
  next: (request: HttpRequest, context: InvocationContext) => Promise<HttpResponseInit>
): Promise<HttpResponseInit> {
  const logContext: LogConfig = {
    contextId: context.invocationId
  };

  return await runInContext<HttpResponseInit>(logContext, async (): Promise<HttpResponseInit> => {
    try {
      return await next(request, context);
    } finally {
      await logger.flush();
    }
  });
}
