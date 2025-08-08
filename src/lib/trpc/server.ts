import { initTRPC } from '@trpc/server';
import { type CreateNextContextOptions } from '@trpc/server/adapters/next';
import { ZodError } from 'zod';

// Simplified context type definition
export interface CreateContextOptions {
  req: CreateNextContextOptions['req'];
  res: CreateNextContextOptions['res'];
}

// Create context for each request - simplified for public endpoints
export const createContext = async (opts: { req: Request; res: Response } | CreateNextContextOptions): Promise<CreateContextOptions> => {
  // Handle both Next.js context and fetch adapter context
  const req = 'headers' in opts.req ? opts.req : (opts as CreateNextContextOptions).req;
  const res = 'headers' in opts.res ? opts.res : (opts as CreateNextContextOptions).res;

  return {
    req: req as any,
    res: res as any,
  };
};

// Initialize tRPC - simplified without superjson
const t = initTRPC.context<CreateContextOptions>().create({
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
