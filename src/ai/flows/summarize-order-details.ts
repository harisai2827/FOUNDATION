'use server';
/**
 * @fileOverview Summarizes order details for the chef.
 *
 * - summarizeOrderDetails - A function that summarizes the order details for the chef.
 * - SummarizeOrderDetailsInput - The input type for the summarizeOrderDetails function.
 * - SummarizeOrderDetailsOutput - The return type for the summarizeOrderDetails function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizeOrderDetailsInputSchema = z.object({
  items: z.array(
    z.object({
      name: z.string().describe('Name of the item.'),
      quantity: z.number().describe('Quantity of the item.'),
      specialRequests: z.string().optional().describe('Any special requests for the item.'),
    })
  ).describe('List of items in the order.'),
});
export type SummarizeOrderDetailsInput = z.infer<typeof SummarizeOrderDetailsInputSchema>;

const SummarizeOrderDetailsOutputSchema = z.object({
  summary: z.string().describe('A concise summary of the order details.'),
});
export type SummarizeOrderDetailsOutput = z.infer<typeof SummarizeOrderDetailsOutputSchema>;

export async function summarizeOrderDetails(input: SummarizeOrderDetailsInput): Promise<SummarizeOrderDetailsOutput> {
  return summarizeOrderDetailsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'summarizeOrderDetailsPrompt',
  input: {schema: SummarizeOrderDetailsInputSchema},
  output: {schema: SummarizeOrderDetailsOutputSchema},
  prompt: `You are a helpful assistant summarizing restaurant orders for the chef.

  Create a concise summary of the order details for the chef, including the quantity and name of each item, and any special requests.

  Order Items:
  {{#each items}}
  - {{quantity}}x {{name}} {{#if specialRequests}} ({{specialRequests}}) {{/if}}
  {{/each}}
  `,
});

const summarizeOrderDetailsFlow = ai.defineFlow(
  {
    name: 'summarizeOrderDetailsFlow',
    inputSchema: SummarizeOrderDetailsInputSchema,
    outputSchema: SummarizeOrderDetailsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
