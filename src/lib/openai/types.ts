// lib/openai/types.ts

export interface ImageAnalysisResult {
  caption: string;
  description: string;
  tags: string[];
  ocr_text: string[];
  focus_x: number;
  focus_y: number;
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
