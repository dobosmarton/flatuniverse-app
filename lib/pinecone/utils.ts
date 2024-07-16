export const createPineconeId = (...ids: (string | number)[]) => `${ids.join('#')}`;
export const getMetadatIdFromPineconeId = (pineconeId: string) => pineconeId.split('#')[0];
