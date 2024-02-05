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
  getAll: publicProcedure
    .input(
      z.object({
        projectId: z.number(),
      }),
    )
    .query(({ ctx, input: { projectId } }) => {
      return ctx.db.task.findMany({
        where: { projectId },
        orderBy: { createdAt: "desc" },
      });
    }),
  getById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(({ ctx, input: { id } }) => {
      return ctx.db.task.findFirst({ where: { id } });
    }),
  update: publicProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().optional(),
        description: z.string().optional(),
        priority: z.enum(["HIGH", "MEDIUM", "LOW", "CRITICAL"]).optional(),
        status: z.enum(TaskStatus).optional(),
        projectId: z.number().optional(),
        assigneeId: z.string().optional(),
      }),
    )
    .mutation(({ ctx, input }) => {
      return ctx.db.task.update({
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
        assigneeId: z.string().optional(),
        priority: z.enum(["HIGH", "MEDIUM", "LOW", "CRITICAL"]),
        createdById: z.string(),
      }),
    )
    .mutation(({ ctx, input }) => {
      return ctx.db.task.create({
        data: {
          name: input.name,
          description: input.description,
          status: input.status,
          projectId: input.projectId,
          assigneeId: input.assigneeId,
          priority: input.priority,
          createdById: input.createdById,
        },
      });
    }),
});
