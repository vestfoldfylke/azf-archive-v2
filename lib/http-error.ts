class HTTPError extends Error {
  statusCode: number;
  data: unknown;

  constructor(code: number, message: string, data: unknown = null) {
    super(message);

    this.statusCode = code;
    this.message = message;
    this.data = data ?? null;
  }
}

export default HTTPError;
