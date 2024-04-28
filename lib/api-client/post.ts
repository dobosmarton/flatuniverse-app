export const post = async <K extends string, A, T>(url: K, { arg }: { arg: A }): Promise<T> => {
  return fetch(url, {
    method: 'POST',
    body: JSON.stringify(arg),
  })
    .then((res) => res.json())
    .then<T>((res) => res.data);
};
