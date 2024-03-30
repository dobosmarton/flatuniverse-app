import { z } from 'zod';

export const withInputValidator = <ParsedInput, Input, Return>(schema: z.Schema) => {
  return (fn: (props: Input) => Promise<Return>) => {
    return async (props: ParsedInput): Promise<Return> => {
      const parsedProps = schema.parse(props);

      return fn(parsedProps);
    };
  };
};
