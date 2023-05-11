export interface Fetcher {
  fetch: typeof fetch;
}

/**
 * {@link ThrottledFetcher}建構子的初始參數。
 *
 * 未提供的屬性將設定為預設值。
 */
export interface ThrottledFetcherOptions {
  maxOutgoingConn?: number;
}

/**
 * 粗糙的限流機制。
 */
export class ThrottledFetcher implements Fetcher {
  private pendingRequests: Set<symbol> = new Set();

  private requestLock?: symbol;

  private unsentRequests: symbol[] = [];

  maxOutgoingConn = 5;

  constructor(options?: ThrottledFetcherOptions) {
    if (!options) {
      return;
    }

    this.unsentRequests = [];
    this.pendingRequests = new Set();
    this.maxOutgoingConn = options.maxOutgoingConn ?? this.maxOutgoingConn;
  }

  async fetch(
    input: URL | RequestInfo,
    init?: RequestInit | undefined
  ): Promise<Response> {
    const requestSymbol = Symbol(input.toString());
    this.unsentRequests.push(requestSymbol);

    return new Promise((resolve, reject) => {
      const attemptFetch = () => {
        if (
          this.unsentRequests[0] !== requestSymbol ||
          this.pendingRequests.size >= this.maxOutgoingConn ||
          this.requestLock
        ) {
          setTimeout(attemptFetch, 50);
          return;
        }

        this.requestLock = requestSymbol;

        this.pendingRequests.add(requestSymbol);
        this.unsentRequests.shift();

        fetch(input, init)
          .then(resolve)
          .catch(reject)
          .finally(() => {
            this.pendingRequests.delete(requestSymbol);
          });

        this.requestLock = undefined;
      };

      attemptFetch();
    });
  }
}
