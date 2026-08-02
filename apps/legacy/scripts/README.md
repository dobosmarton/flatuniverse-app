# How to run scripts

## Pinecone Metadata Migration Scripts

This directory contains two scripts for migrating Pinecone vector database metadata:

### pinecone-metadata-migration.ts

This script updates metadata fields for existing vectors in your Pinecone index. It adds the metadataId to the metadata.

To run:

`pnpm run migrate:pinecone:metadata`

### pinecone-timestamp-migration.ts

This script updates metadata fields for existing vectors in your Pinecone index. It adds the article published timestamp to the metadata.

To run:

`pnpm run migrate:pinecone:timestamp`
