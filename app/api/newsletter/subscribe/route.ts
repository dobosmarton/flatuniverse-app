import { NextRouteFunction } from '@/lib/route-validator.server';
import * as logger from '@/lib/logger';
import * as newsletterService from '@/lib/newsletter';
import { emailParamsSchema } from './schema';

type Params = { params: { email: string } };

const subscribeToNewsletter: NextRouteFunction<Params> = async (req) => {
  const reqJson = await req.json();

  const parsedParams = emailParamsSchema.parse(reqJson);

  const newsletter = await newsletterService.subscribeToNewsletter(parsedParams.email);

  logger.log('Successfull email subscription', newsletter);

  return Response.json('Successfully subscribed to the newsletter!', { status: 200 });
};

export const POST = subscribeToNewsletter;
