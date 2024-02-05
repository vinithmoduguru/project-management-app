import { taskRouter } from "@/server/api/routers/task";
import { projectRouter } from "@/server/api/routers/project";
import { createTRPCRouter } from "@/server/api/trpc";
import { userRouter } from "./routers/users";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  tasks: taskRouter,
  projects: projectRouter,
  users: userRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
