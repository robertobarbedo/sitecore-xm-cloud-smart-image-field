// lib/openai/config.ts

import { OpenAIConfig } from './types';

/**
 * Get OpenAI configuration from environment variables
 */
export function getOpenAIConfig(): OpenAIConfig {
  const apiKey = process.env.OPENAI_API_KEY || '';
  
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY environment variable is not set');
  }

  return {
    apiKey,
    model: 'gpt-4o-mini' // Using GPT-4o mini as specified
  };
}

/**
 * Check if OpenAI is configured and available
 */
export function isOpenAIConfigured(): boolean {
  return !!process.env.OPENAI_API_KEY;
}
