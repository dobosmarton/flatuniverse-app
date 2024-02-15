export const fetcher = async <T>(url: string): Promise<T | null> => {
  return fetch(url)
    .then((res) => res.json())
    .then<T | null>((res) => res.data);
};
