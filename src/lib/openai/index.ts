// lib/openai/index.ts

// Export types
export type { 
  ImageAnalysisResult, 
  OpenAIConfig, 
  ImageAnalysisOptions 
} from './types';

// Export client functions (for use in components)
export { 
  analyzeImageClient, 
  checkOpenAIAvailability 
} from './client';

// Export server-side functions (for use in API routes)
export { 
  analyzeImage, 
  fileToBase64 
} from './image-analyzer';

export { 
  getOpenAIConfig, 
  isOpenAIConfigured 
} from './config';
