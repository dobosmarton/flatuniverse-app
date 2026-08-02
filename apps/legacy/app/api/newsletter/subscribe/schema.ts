import { z } from 'zod';

export const emailParamsSchema = z.object(
  {
    email: z.string().email(),
  },
  { required_error: 'Email param is required for subscribing to the newsletter' }
);

export type SubscribeToNewsletterParams = z.infer<typeof emailParamsSchema>;
