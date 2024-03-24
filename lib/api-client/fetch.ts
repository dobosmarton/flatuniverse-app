export const fetcher = async <T>(url: string, next?: NextFetchRequestConfig): Promise<T | null> => {
  return fetch(url, { next })
    .then((res) => res.json())
    .then<T | null>((res) => res.data);
};
