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
  };

  return AnthropicConfigSchema.parse(config);
}