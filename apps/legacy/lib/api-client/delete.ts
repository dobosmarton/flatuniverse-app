export const del = async <K extends string>(url: K, id?: string) => {
  return fetch(`${url}/${id}`, {
    method: 'DELETE',
  });
};
