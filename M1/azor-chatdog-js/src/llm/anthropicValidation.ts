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
    modelName: process.env.MODEL_NAME || 'claude-3-5-haiku-latest',
    anthropicApiKey: process.env.ANTHROPIC_API_KEY || '',
    modelConfig: {
      topP: Number(process.env.TOP_P),
      topK: Number(process.env.TOP_K),
      temperature: Number(process.env.TEMPERATURE)
    }
  };

  return AnthropicConfigSchema.parse(config);
}