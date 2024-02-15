import { Document } from '@langchain/core/documents';
import { PDFLoader } from 'langchain/document_loaders/fs/pdf';
import { PDFMetadata } from './types';

export const loadPDF = async <T extends Record<string, any>>(
  pdfPath: string,
  metadata: T
): Promise<Document<PDFMetadata<T>>[]> => {
  const response = await fetch(pdfPath, { cache: 'no-store' });

  const blobFile = await response.blob();

  const loader = new PDFLoader(blobFile, {
    splitPages: true,
  });

  const docs = await loader.load();

  docs.forEach((doc) => {
    doc.metadata = {
      ...doc.metadata,
      article: metadata,
    };
  });

  return docs as Document<PDFMetadata<T>>[];
};
