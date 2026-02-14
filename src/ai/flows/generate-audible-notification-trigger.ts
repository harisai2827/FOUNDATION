'use server';
/**
 * @fileOverview This file defines a Genkit flow to determine whether to trigger an audible notification for new kitchen orders.
 *
 * - generateAudibleNotificationTrigger - A function that determines if an audible notification should be triggered.
 * - AudibleNotificationInput - The input type for the generateAudibleNotificationTrigger function.
 * - AudibleNotificationOutput - The return type for the generateAudibleNotificationTrigger function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AudibleNotificationInputSchema = z.object({
  orderQueueLength: z
    .number()
    .describe('The current number of orders in the kitchen queue.'),
  timeOfDay: z.string().describe('The current time of day (e.g., 3:00 PM).'),
  dayOfWeek: z.string().describe('The current day of the week (e.g., Monday).'),
});
export type AudibleNotificationInput = z.infer<typeof AudibleNotificationInputSchema>;

const AudibleNotificationOutputSchema = z.object({
  triggerNotification: z
    .boolean()
    .describe(
      'Whether or not an audible notification should be triggered for the new order.'
    ),
  reason: z
    .string()
    .describe(
      'The reason for triggering or not triggering the audible notification.'
    ),
});
export type AudibleNotificationOutput = z.infer<typeof AudibleNotificationOutputSchema>;

export async function generateAudibleNotificationTrigger(
  input: AudibleNotificationInput
): Promise<AudibleNotificationOutput> {
  return generateAudibleNotificationTriggerFlow(input);
}

const prompt = ai.definePrompt({
  name: 'audibleNotificationPrompt',
  input: {schema: AudibleNotificationInputSchema},
  output: {schema: AudibleNotificationOutputSchema},
  prompt: `You are a restaurant management expert advising a kitchen on when to trigger audible notifications for new orders.

  Consider the following factors to determine if an audible notification is necessary:

  - **orderQueueLength**: The number of orders currently in the queue.
  - **timeOfDay**: The current time of day.
  - **dayOfWeek**: The current day of the week.

  During peak hours (e.g., lunch and dinner rushes) or when the order queue is long, it is more important to trigger notifications to ensure no orders are missed.
  Outside of peak hours or when the queue is short, notifications may be less critical.

  Based on these factors, decide whether to trigger an audible notification for a new order. Explain your reasoning.

  Current order queue length: {{{orderQueueLength}}}
  Current time of day: {{{timeOfDay}}}
  Current day of week: {{{dayOfWeek}}}
  Output:
`,
});

const generateAudibleNotificationTriggerFlow = ai.defineFlow(
  {
    name: 'generateAudibleNotificationTriggerFlow',
    inputSchema: AudibleNotificationInputSchema,
    outputSchema: AudibleNotificationOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
