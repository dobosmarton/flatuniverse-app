import { NextResponse } from 'next/server';
import { NextRouteFunction } from '@/lib/route-validator.server';
import * as threadService from '@/lib/chat/thread.server';
import { verifyTurnstileToken } from '@/lib/security/captcha';
import { createNewThreadDataSchema } from './schema';

type Params = { params: { prompt: string } };

const createNewThread: NextRouteFunction<{}, Params> = async (req) => {
  const reqJson = await req.json();

  const token = req.headers.get('X-Captcha-Token');

  const parsedParams = createNewThreadDataSchema.parse(reqJson);

  if (!token) {
    return NextResponse.json({ error: 'Turnstile token is required' }, { status: 400 });
  }

  const isValid = await verifyTurnstileToken(token);
  if (!isValid) {
    return NextResponse.json({ error: 'Invalid Turnstile token' }, { status: 400 });
  }

  const thread = await threadService.create(parsedParams.prompt);

  return NextResponse.json({ data: thread }, { status: 200 });
};

export const POST = createNewThread;
