const PAGE_SIZE = 10;

type QueryParams = {
  searchTerm?: string;
  categoryGroups?: string[];
  categories?: string[];
  authors?: string[];
  from?: Date;
  to?: Date;
  page?: number;
  pageSize?: number;
};

export const constructQueryParams = ({
  searchTerm,
  categoryGroups,
  categories,
  authors,
  from,
  to,
  page = 1,
  pageSize = PAGE_SIZE,
}: QueryParams) => {
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
