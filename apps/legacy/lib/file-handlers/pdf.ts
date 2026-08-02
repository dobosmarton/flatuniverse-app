'use server';

import { cosineSimilarity } from 'ai';
import { extractText, getDocumentProxy } from 'unpdf';
import { SentenceSplitter } from '@llamaindex/core/node-parser';
import { Metadata, Document, TextNode } from '@llamaindex/core/schema';
import { OpenAIEmbedding } from '@llamaindex/edge/embeddings/OpenAIEmbedding';
import { Settings } from '@llamaindex/edge/Settings';
import { logger } from '@trigger.dev/sdk/v3';

/**
 * OpenAI embeddings instance configured with text-embedding-3-small model
 * and cosine similarity comparison function.
 *
 * Cosine similarity measures the similarity between two vectors by calculating
 * the cosine of the angle between them. The result ranges from -1 to 1, where:
 * - 1 means the vectors are identical
 * - 0 means they are perpendicular (completely different)
 * - -1 means they are opposite
 *
 * Used to generate embeddings for PDF text chunks and compare their semantic
 * similarity by measuring the cosine angle between their vector representations.
 */
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

/**
 * Loads a PDF file from a URL, splits it into text chunks, and generates embeddings.
 *
 * @param pdfPath - The URL path to the PDF file to load
 * @param metadata - Additional metadata to attach to each text node
 * @returns An array of TextNodes containing the chunked text and embeddings
 *
 * The function:
 * 1. Creates a sentence splitter to chunk the text
 * 2. Loads and extracts text from the PDF
 * 3. Splits the text into nodes
 * 4. Generates embeddings for each node
 * 5. Returns TextNodes with the text, embeddings and metadata
 */
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
