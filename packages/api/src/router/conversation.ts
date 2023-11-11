import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";

// Conversation tRPC router
export const conversationRouter = createTRPCRouter({
  // List all conversations
  allForId: publicProcedure.input(z.string()).query(({ ctx, input }) => {
    return ctx.prisma.conversation.findMany({
      where: { userId, input },
    });
  }),

  // Create a conversation
  create: protectedProcedure
    .input(
      z.object({
        userId: z.string().uuid(),
        type: z.string(),
        review: z.string().optional(),
        score: z.number().optional(),
      }),
    )
    .mutation(({ ctx, input }) => {
      // Add your authentication logic here
      return ctx.prisma.conversation.create({
        data: input,
      });
    }),

  // Update a conversation
  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        review: z.string().optional(),
        score: z.number().optional(),
      }),
    )
    .mutation(({ ctx, input }) => {
      // Add your authentication logic here
      return ctx.prisma.conversation.update({
        where: { id: input.id },
        data: input,
      });
    }),

  // Delete a conversation
  delete: protectedProcedure.input(z.number()).mutation(({ ctx, input }) => {
    // Add your authentication logic here
    return ctx.prisma.conversation.delete({
      where: { id: input },
    });
  }),
});
