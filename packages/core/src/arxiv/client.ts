import { Context, Data, Duration, Effect, Layer, Schedule } from 'effect';

/**
 * arXiv answers 503 while it materialises a resumption set, and asks callers to
 * come back after the advertised interval. Anything else in the 5xx range, or a
 * transport failure, is also worth another attempt; 4xx is not.
 */
export class ArxivUnavailable extends Data.TaggedError('ArxivUnavailable')<{
  readonly url: string;
  readonly status: number | undefined;
  readonly retryable: boolean;
  readonly cause?: unknown | undefined;
}> {}

type ArxivClientApi = {
  readonly fetchPage: (url: string) => Effect.Effect<string, ArxivUnavailable>;
};

/**
 * The seam between the harvester and the network.
 *
 * Deliberately our own interface rather than `effect/unstable/http`: the
 * harvester needs exactly one operation, tests want to swap it for a canned
 * response, and `unstable/` is a moving target we would rather not pin the
 * domain package to. `fetch` is a global on every runtime this project targets.
 */
export class ArxivClient extends Context.Service<ArxivClient, ArxivClientApi>()('ArxivClient') {}

/** arXiv asks harvesters to stay near one request every three seconds. */
const POLITE_INTERVAL = Duration.seconds(3);

const REQUEST_TIMEOUT = Duration.seconds(180);

const RETRY_ATTEMPTS = 4;

const RETRY_BASE_DELAY = Duration.seconds(5);

/** Bounds on how long we will honour a `Retry-After` before giving up on it. */
const RETRY_AFTER_MIN = Duration.seconds(5);
const RETRY_AFTER_MAX = Duration.seconds(600);
const RETRY_AFTER_DEFAULT = Duration.seconds(10);

const clampRetryAfter = (delay: Duration.Duration): Duration.Duration =>
  Duration.min(RETRY_AFTER_MAX, Duration.max(RETRY_AFTER_MIN, delay));

/**
 * `Retry-After` is either a number of seconds or an HTTP date. Anything we
 * cannot read falls back to a fixed pause rather than hammering the endpoint.
 */
const parseRetryAfter = (header: string | null, now: number): Duration.Duration => {
  if (header === null) return RETRY_AFTER_DEFAULT;

  const seconds = Number(header.trim());
  if (Number.isInteger(seconds)) return clampRetryAfter(Duration.seconds(seconds));

  const deadline = Date.parse(header);
  if (Number.isNaN(deadline)) return RETRY_AFTER_DEFAULT;

  return clampRetryAfter(Duration.millis(deadline - now));
};

const SERVICE_UNAVAILABLE = 503;

const isRetryableStatus = (status: number): boolean => status >= 500;

const fetchOnce = (url: string): Effect.Effect<string, ArxivUnavailable> =>
  Effect
    .tryPromise({
      try: () => fetch(url),
      catch: (cause) => new ArxivUnavailable({ url, status: undefined, retryable: true, cause }),
    })
    .pipe(
      Effect.flatMap((response) => {
        if (response.ok) {
          return Effect.tryPromise({
            try: () => response.text(),
            catch: (cause) => new ArxivUnavailable({ url, status: response.status, retryable: true, cause }),
          });
        }

        const failure = new ArxivUnavailable({
          url,
          status: response.status,
          retryable: isRetryableStatus(response.status),
        });

        // Honour the advertised pause before surrendering to the retry policy,
        // which would otherwise come back sooner than arXiv asked.
        if (response.status === SERVICE_UNAVAILABLE) {
          return Effect.sleep(parseRetryAfter(response.headers.get('retry-after'), Date.now())).pipe(
            Effect.andThen(Effect.fail(failure)),
          );
        }

        return Effect.fail(failure);
      }),
    );

const retryPolicy = Schedule.exponential(RETRY_BASE_DELAY, 2).pipe(Schedule.jittered);

const fetchPage = (url: string): Effect.Effect<string, ArxivUnavailable> => {
  const timedOut = new ArxivUnavailable({ url, status: undefined, retryable: true });

  const withTimeout = Effect.timeoutOrElse(fetchOnce(url), {
    duration: REQUEST_TIMEOUT,
    orElse: () => Effect.fail(timedOut),
  });

  const withRetry = Effect.retry(withTimeout, {
    schedule: retryPolicy,
    times: RETRY_ATTEMPTS,
    while: (error: ArxivUnavailable) => error.retryable,
  });

  // Spacing every request keeps a long backfill within arXiv's guidance without
  // the harvester having to think about it.
  return Effect.tap(withRetry, () => Effect.sleep(POLITE_INTERVAL));
};

export const layerFetch = Layer.succeed(ArxivClient)(ArxivClient.of({ fetchPage }));

/** Answers every request with the same body. For tests and local replay. */
export const layerCanned = (body: string): Layer.Layer<ArxivClient> =>
  Layer.succeed(ArxivClient)(ArxivClient.of({ fetchPage: () => Effect.succeed(body) }));
