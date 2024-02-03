import { z } from "zod";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "@/server/api/trpc";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const TaskStatus = [
  "BACKLOG",
  "IN_PROGRESS",
  "WAITING_FOR_REVIEW",
  "DONE",
  "STUCK",
] as const;

export const taskRouter = createTRPCRouter({
  getAll: publicProcedure.query(({ ctx }) => {
    return ctx.db.task.findMany();
  }),
  update: publicProcedure
    .input(z.object({ id: z.number(), status: z.enum(TaskStatus) }))
    .mutation(({ input }) => {
      return prisma.task.update({
        where: { id: input.id },
        data: { status: input.status },
      });
    }),
});
