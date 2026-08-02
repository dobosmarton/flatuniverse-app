export class FetchError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.status = status;
  }
}

export class RetriableFetchError extends FetchError {
  retryAfter: number;

  constructor(message: string, retryAfter: number) {
    super(message);
    this.retryAfter = retryAfter;
  }
}

export const fetcher = async <T>(url: string, next?: NextFetchRequestConfig): Promise<T | null> => {
  return fetch(url, { next })
    .then((res) => {
      if (!res.ok) {
        throw new FetchError('An error occurred while fetching the data.', res.status);
      }

      const retryAfter = res.headers.get('Retry-After');

      if (retryAfter) {
        throw new RetriableFetchError('Retry data fetching', parseInt(retryAfter, 10) * 1000);
      }

      return res.json();
    })
    .then<T | null>((res) => res.data);
};
