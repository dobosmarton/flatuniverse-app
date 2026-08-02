export const log = (...messages: unknown[]) => {
  console.log(`[LOG]`, ...messages);
};

export const error = (...messages: unknown[]) => {
  console.error(`[ERROR]`, ...messages);
};
