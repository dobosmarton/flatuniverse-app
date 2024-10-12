import { extractText, getDocumentProxy } from 'unpdf';
import { TextNode, Metadata, ObjectType } from '@llamaindex/edge';
import { Document, SentenceSplitter } from 'llamaindex';

const loadPDFData = async (buffer: Uint8Array): Promise<Document<Metadata>[]> => {
  const pdf = await getDocumentProxy(buffer);
  // Extract text from PDF
  const { totalPages, text } = await extractText(pdf);

  return text.map((text, page) => {
    const metadata = {
      page_number: page + 1,
      total_pages: totalPages,
    };
    return new Document({ text, metadata });
  });
};

/**
 * Retrieves the documents from the specified file URL.
 *
 * @param fileUrl - The URL of the file to fetch.
 * @returns A promise that resolves to an array of documents with metadata.
 * @throws An error if the file fetch fails.
 */
export const getDocumentsFromPDF = async (fileUrl: string): Promise<Document<Metadata>[]> => {
  const uploadedData = await fetch(fileUrl);

  if (!uploadedData.ok) {
    throw new Error('Failed to fetch file');
  }

  const content = await uploadedData.arrayBuffer();

  const documents = await loadPDFData(new Uint8Array(content));

  return documents;
};

export const loadPDF = async <T extends Metadata>(pdfPath: string, metadata: T): Promise<TextNode<T>[]> => {
  const splitter = new SentenceSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
  });

  const docs = await getDocumentsFromPDF(pdfPath);

  const nodes = splitter.getNodesFromDocuments(docs);

  return nodes.map(
    (node) =>
      new TextNode({
        ...node,
        getType: () => ObjectType.DOCUMENT,
        metadata: {
          ...node.metadata,
          ...metadata,
        },
      }) as TextNode<T>
  );
};
