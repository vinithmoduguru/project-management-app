import { taskRouter } from "@/server/api/routers/task";
import { projectRouter } from "@/server/api/routers/project";
import { createTRPCRouter } from "@/server/api/trpc";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  tasks: taskRouter,
  projects: projectRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
