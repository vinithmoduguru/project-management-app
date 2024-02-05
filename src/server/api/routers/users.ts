import { z } from "zod";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "@/server/api/trpc";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const userRouter = createTRPCRouter({
  getAll: publicProcedure.query(async () => {
    return await prisma.user.findMany();
  }),
});
