import { Document } from '@langchain/core/documents';
import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { PDFMetadata } from './types';

export const loadPDF = async <T extends Record<string, any>>(
  pdfPath: string,
  metadata: T
): Promise<Document<PDFMetadata<T>>[]> => {
  const response = await fetch(pdfPath, { cache: 'no-store' });

  const blobFile = await response.blob();

  const loader = new PDFLoader(blobFile);

  const docs = await loader.load();

  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
  });

  const splitDocs = await splitter.splitDocuments(docs);

  splitDocs.forEach((doc) => {
    doc.metadata = {
      ...(doc.metadata ?? {}),
      article: metadata,
    };
  });

  return splitDocs as Document<PDFMetadata<T>>[];
};
