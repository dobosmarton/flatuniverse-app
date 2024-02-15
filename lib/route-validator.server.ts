'use server';

import { NextRequest } from 'next/server';
import { z } from 'zod';

export type NextRouteFunction<T extends Record<string, unknown>, V = null> = (
  req: NextRequest,
  params: T,
  parsedBody: V
) => Promise<Response>;

export const routeValidator = <T extends Record<string, unknown>, V>(
  routeFn: NextRouteFunction<T, V>,
  validator: z.Schema<V>
) => {
  return async (req: NextRequest, params: T) => {
    const body = await req.json();

    const parsedBody = validator.parse(body);

    return routeFn(req, params, parsedBody);
  };
};
