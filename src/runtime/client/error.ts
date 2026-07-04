export class DdysError extends Error {
  constructor(
    message: string,
    readonly status = 0,
    readonly method = 'GET',
    readonly path = '',
    readonly causePayload?: unknown
  ) {
    super(message);
    this.name = 'DdysError';
  }
}
