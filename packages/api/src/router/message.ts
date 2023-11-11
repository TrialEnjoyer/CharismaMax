import { z } from "zod";

import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";

export const messageRouter = createTRPCRouter({
  // List all messages for a conversation
  allByConversationId: publicProcedure
    .input(z?.number())
    .query(({ ctx, input }) => {
      return ctx.prisma.message.findMany({
        orderBy: { id: "asc" },
        where: { conversation: input },
        //take: input, - removed max items fetched
      });
    }),

  // Create a message
  create: protectedProcedure
    .input(
      z.object({
        userId: z.number(),
        conversationId: z.number(),
        text: z.string(),
        score: z.number().optional(),
        review: z.string().optional(),
        reply: z.string().optional(),
        history: z.array(z.string()),
      }),
    )
    .mutation(({ ctx, input }) => {
      // Add your authentication logic here
      return ctx.prisma.message.create({
        data: input,
      });
    }),

  // Update a message
  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        text: z.string().optional(),
        score: z.number().optional(),
        review: z.string().optional(),
        history: z.array(z.string()).optional(),
      }),
    )
    .mutation(({ ctx, input }) => {
      // Add your authentication logic here
      return ctx.prisma.message.update({
        where: { id: input.id },
        data: input,
      });
    }),

  // Delete a message
  delete: protectedProcedure.input(z.number()).mutation(({ ctx, input }) => {
    // Add your authentication logic here
    return ctx.prisma.message.delete({
      where: { id: input },
    });
  }),
});
