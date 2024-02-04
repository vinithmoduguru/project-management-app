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
    .input(
      z.object({
        id: z.number(),
        name: z.string().optional(),
        description: z.string().optional(),
        priority: z.enum(["HIGH", "MEDIUM", "LOW", "CRITICAL"]).optional(),
        status: z.enum(TaskStatus).optional(),
      }),
    )
    .mutation(({ input }) => {
      return prisma.task.update({
        where: { id: input.id },
        data: { ...input },
      });
    }),
  create: protectedProcedure
    .input(
      z.object({
        name: z.string(),
        description: z.string().optional(),
        status: z.enum(TaskStatus),
        projectId: z.number(),
        priority: z.enum(["HIGH", "MEDIUM", "LOW", "CRITICAL"]),
        createdById: z.string(),
      }),
    )
    .mutation(({ input }) => {
      return prisma.task.create({
        data: {
          name: input.name,
          description: input.description,
          status: input.status,
          projectId: input.projectId,
          priority: input.priority,
          createdById: input.createdById,
        },
      });
    }),
});
