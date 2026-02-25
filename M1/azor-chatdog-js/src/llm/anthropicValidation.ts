/**
 * Anthropic configuration validation using Zod
 */

import { z } from 'zod';

/**
 * Anthropic configuration schema
 */
export const AnthropicConfigSchema = z.object({
  engine: z.literal('ANTHROPIC').default('ANTHROPIC'),
  modelName: z.string().min(1, 'Model name is required'),
  anthropicApiKey: z.string().min(1, 'Anthropic API key is required'),
  modelConfig: z.object({
    topP: z.number().min(0).max(1).default(0.5),
    topK: z.number().min(0).int().default(1),
    temperature: z.number().min(0).max(1).default(1)
  })
});

export type AnthropicConfig = z.infer<typeof AnthropicConfigSchema>;

/**
 * Validate and parse Anthropic configuration from environment
 */
export function validateAnthropicConfig(): AnthropicConfig {
  const config = {
    engine: 'ANTHROPIC' as const,
    modelName: process.env.MODEL_NAME || 'claude-haiku-4-5-20251001',
    anthropicApiKey: process.env.ANTHROPIC_API_KEY || '',
    modelConfig: {
      topP: process.env.TOP_P ? Number(process.env.TOP_P) : undefined,
      topK: process.env.TOP_K ? Number(process.env.TOP_K) : undefined,
      temperature: process.env.TEMPERATURE ? Number(process.env.TEMPERATURE) : undefined
    }
  };

  return AnthropicConfigSchema.parse(config);
}