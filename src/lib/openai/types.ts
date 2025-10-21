// lib/openai/types.ts

export interface ImageAnalysisResult {
  caption: string;
  tags: string[];
  ocr_text: string[];
}

export interface OpenAIConfig {
  apiKey: string;
  model?: string;
}

export interface ImageAnalysisOptions {
  includeOCR?: boolean;
  includeTags?: boolean;
  maxTokens?: number;
}
