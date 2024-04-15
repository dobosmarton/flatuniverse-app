const PAGE_SIZE = 10;

export const constructQueryParams = (
  searchTerm: string,
  categoryGroups: string[] | undefined,
  categories: string[] | undefined,
  authors: string[] | undefined,
  from: Date | undefined,
  to: Date | undefined,
  page = 1,
  pageSize = PAGE_SIZE
) => {
  const params: Record<string, string> = {
    page: page.toString(),
    pageSize: pageSize.toString(),
  };
  if (categoryGroups?.length) {
    params.groups = categoryGroups.join(',');
  }
  if (categories?.length) {
    params.categories = categories.join(',');
  }
  if (authors?.length) {
    params.authors = authors.join(',');
  }
  if (from) {
    params.from = from.toDateString();
  }
  if (to) {
    params.to = to.toDateString();
  }
  if (searchTerm) {
    params.search = searchTerm;
  }

  return new URLSearchParams(params);
};
