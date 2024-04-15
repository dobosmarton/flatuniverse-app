import { NextRouteFunction } from '@/lib/route-validator.server';
import * as logger from '@/lib/logger';
import * as newsletterService from '@/lib/newsletter';

type Params = { params: { email: string } };

const sendWeeklySummaryEmail: NextRouteFunction<Params> = async () => {
  const newsletter = await newsletterService.sendWeeklySummaryEmail();

  return Response.json('Weekly newsletter succesfully sent!', { status: 200 });
};

export const POST = sendWeeklySummaryEmail;
