export type PDFMetadata<T> = {
  pdf: {
    totalPages: number;
  };
  loc: {
    pageNumber: number;
  };
  article: T;
};

export type SimilarityModel = {
  _distance: number | null;
  id: string;
  metadata_id: string;
};

export type SimilarityResult = {
  id: string;
  metadata_id: string;
};
