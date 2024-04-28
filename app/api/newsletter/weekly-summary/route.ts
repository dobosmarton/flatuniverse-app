import { NextRouteFunction } from '@/lib/route-validator.server';
import * as newsletterService from '@/lib/newsletter';

type Params = {};

const sendWeeklySummaryEmail: NextRouteFunction<Params> = async () => {
  const newsletter = await newsletterService.sendWeeklySummaryEmail();

  return Response.json('Weekly newsletter succesfully sent!', { status: 200 });
};

export const POST = sendWeeklySummaryEmail;
