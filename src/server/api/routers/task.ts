import { z } from "zod";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "@/server/api/trpc";

export const taskRouter = createTRPCRouter({
  getAll: publicProcedure.query(({ ctx }) => {
    return ctx.db.task.findMany();
  }),
  // create: publicProcedure.mutation(({ ctx, input }) => {
  //   return ctx.db.task.create({
  //     data: {
  //       title: input.title,
  //       description: input.description,
  //       status: input.status,
  //       userId: input.userId,
  //     },
  //   });
  // }),
});
