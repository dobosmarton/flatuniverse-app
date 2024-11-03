'use server';

import { cosineSimilarity } from 'ai';
import { extractText, getDocumentProxy } from 'unpdf';
import { SentenceSplitter } from '@llamaindex/core/node-parser';
import { Metadata, Document, TextNode } from '@llamaindex/core/schema';
import { OpenAIEmbedding } from '@llamaindex/edge/embeddings/OpenAIEmbedding';
import { Settings } from '@llamaindex/edge/Settings';
import { logger } from '@trigger.dev/sdk/v3';

const openAIEmbeddings = new OpenAIEmbedding({
  model: 'text-embedding-3-small',
  similarity: (a, b) => {
    return cosineSimilarity(a, b);
  },
});

Settings.embedModel = openAIEmbeddings;

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

export const loadPDF = async (pdfPath: string, metadata: Metadata): Promise<TextNode<Metadata>[]> => {
  const splitter = new SentenceSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
  });

  const docs = await getDocumentsFromPDF(pdfPath);

  const nodes = splitter.getNodesFromDocuments(docs);

  return Promise.all(
    nodes.map(async (node) => {
      const embeddings = await openAIEmbeddings.getTextEmbeddingsBatch(splitter.splitText(node.text));

      logger.info(
        `Node - embedding: ${embeddings.length}, ${embeddings[0].length}, ${node.type}, ${node.text.length}`,
        {
          time: new Date().toISOString(),
        }
      );

      return new TextNode({
        ...node,
        embedding: embeddings[0],
        metadata: {
          ...node.metadata,
          ...metadata,
        },
      });
    })
  );
};
