import { ServerClient } from 'postmark';

export const postmarkClient = new ServerClient(process.env.POSTMARK_SERVER_TOKEN ?? '');
