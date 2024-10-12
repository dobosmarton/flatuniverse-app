import { defineConfig } from '@trigger.dev/sdk/v3';
import { prismaExtension } from '@trigger.dev/build/extensions/prisma';
// import { PrismaInstrumentation } from '@prisma/instrumentation';

export default defineConfig({
  project: 'proj_ryemeoftoazpidlndtjl',
  logLevel: 'log',
  retries: {
    enabledInDev: true,
    default: {
      maxAttempts: 1,
      minTimeoutInMs: 1000,
      maxTimeoutInMs: 10000,
      factor: 2,
      randomize: true,
    },
  },
  build: {
    external: ['@xenova/transformers', 'tiktoken'],
    extensions: [
      prismaExtension({
        schema: './prisma/schema.prisma',
      }),
    ],
  },
  dirs: ['./trigger'],

  //instrumentations: [new PrismaInstrumentation()],
});
