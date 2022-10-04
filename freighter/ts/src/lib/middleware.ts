/**
 * MetaData is the metadata associated with a freighter transport request.
 *
 * @property target - The target the request is being issued to.
 * @property protocol - The protocol used to issue the request.
 * @property params - Arbitrary string parameters that can be set by client side
 *   middleware and read by server side middleware.
 */
export type MetaData = {
  target: string;
  protocol: string;
  params: Record<string, string>;
};

/** Next executes the next middleware in the chain. */
export type Next = (md: MetaData) => Promise<Error | undefined>;

/**
 * Middleware represents a general middleware function that can be used to
 * parse/attach metadata to a request or alter its behavior.
 */
export type Middleware = (
  md: MetaData,
  next: Next
) => Promise<Error | undefined>;

/**
 * Finalizer is a middleware that is executed as the last step in the chain.
 * Finalizer middleware should be used to execute the request.
 */
type Finalizer = (md: MetaData) => Promise<Error | undefined>;

/**
 * MiddlewareCollector is a class that can be used to collect and execute
 * middleware in order to implement the Transport interface.
 */
export class MiddlewareCollector {
  middleware: Middleware[] = [];

  /** Implements the Transport interface */
  use(...mw: Middleware[]) {
    this.middleware.push(...mw);
  }

  /**
   * Executes middleware in order, passing the the metadata to each middleware
   * until the end of the chain is reached. It then calls the finalizer with the
   * metadata.
   *
   * @param md - The metadata to pass to the middleware.
   * @param finalizer - The finalizer to call with the metadata.
   * @returns An error if one was encountered, otherwise undefined.
   */
  executeMiddleware(
    md: MetaData,
    finalizer: Finalizer
  ): Promise<Error | undefined> {
    let i = 0;
    const next = (md: MetaData): Promise<Error | undefined> => {
      if (i == this.middleware.length) return finalizer(md);
      const _mw = this.middleware[i];
      i++;
      return _mw(md, next);
    };
    return next(md);
  }
}