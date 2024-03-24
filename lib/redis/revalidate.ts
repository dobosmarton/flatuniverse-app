import { client } from './client';

export const revalidateKey = async (key: string) => {
  return client.del(key);
};
