/**
 * Gemini configuration validation using Zod
 */

import { z } from 'zod';

/**
 * Gemini configuration schema
 */
export const GeminiConfigSchema = z.object({
  engine: z.literal('GEMINI').default('GEMINI'),
  modelName: z.string().min(1, 'Model name is required'),
  geminiApiKey: z.string().min(1, 'Gemini API key is required'),
  modelConfig: z.object({
    topP: z.number().min(0).max(1).default(0.5),
    topK: z.number().min(0).max(100).default(1),
    temperature: z.number().min(0).max(2).default(1)
  })
});

export type GeminiConfig = z.infer<typeof GeminiConfigSchema>;

/**
 * Validate and parse Gemini configuration from environment
 */
export function validateGeminiConfig(): GeminiConfig {
  const config = {
    engine: 'GEMINI' as const,
    modelName: process.env.MODEL_NAME || 'gemini-2.5-flash',
    geminiApiKey: process.env.GEMINI_API_KEY || '',
    modelConfig: {
      topP: Number(process.env.TOP_P),
      topK: Number(process.env.TOP_K),
      temperature: Number(process.env.TEMPERATURE),
    }
  };

  return GeminiConfigSchema.parse(config);
}
