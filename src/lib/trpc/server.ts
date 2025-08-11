import { initTRPC } from '@trpc/server';
import { type CreateNextContextOptions } from '@trpc/server/adapters/next';
import { ZodError } from 'zod';

// Context type for tRPC
export type Context = Record<string, never>;

// Create context for each request - minimal for public endpoints
export const createContext = async (): Promise<Context> => {
  // Return empty context since we're only using public procedures
  return {};
};

// Initialize tRPC
const t = initTRPC.context<typeof createContext>().create({
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

// Base router and procedure helpers - simplified for public endpoints only
export const createTRPCRouter = t.router;
export const publicProcedure = t.procedure;
