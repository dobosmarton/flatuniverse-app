type PostArgs<Headers, Data> = {
  headers?: Headers;
  data: Data;
};

export const post = async <Headers, Data, Response>(
  url: string,
  { arg }: { arg: PostArgs<Headers, Data> }
): Promise<Response> => {
  const result = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...arg.headers,
    },
    body: JSON.stringify(arg.data),
  });

  if (!result.ok) {
    const error = new Error('An error occurred while fetching the data.');
    error.cause = await result.json();
    throw error;
  }

  const jsonResult = await result.json();

  return jsonResult.data;
};
