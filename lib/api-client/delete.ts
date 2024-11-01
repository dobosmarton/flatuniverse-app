export const del = async <K extends string>(url: K) => {
  return fetch(url, {
    method: 'DELETE',
  });
};
