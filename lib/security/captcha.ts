const TURNSTILE_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

type TurnstileResponse = {
  success: boolean;
};

export const verifyTurnstileToken = async (token: string): Promise<boolean> => {
  const body = new FormData();

  body.append('secret', process.env.TURNSTILE_SECRET_KEY ?? '');
  body.append('response', token);

  const response = await fetch(TURNSTILE_URL, {
    method: 'POST',
    body,
  });

  if (!response.ok) {
    return false;
  }

  const json: TurnstileResponse = await response.json();

  return json.success;
};
