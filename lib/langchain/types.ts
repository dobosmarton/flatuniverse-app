export type PDFMetadata<T> = {
  pdf: {
    totalPages: number;
  };
  loc: {
    pageNumber: number;
  };
  article: T;
};

export type SimilarityResult = {
  metadataId: string;
  similarItems: string[];
};
