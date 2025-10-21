// lib/openai/client.ts

import { ImageAnalysisResult } from './types';
import { fileToBase64 } from './image-analyzer';

/**
 * Client-side function to analyze an image using the OpenAI API
 * This calls our server-side API endpoint to keep the API key secure
 * @param file - The image file to analyze
 * @param base64Data - Optional: Pre-converted base64 data (with data URI prefix)
 * @returns Analysis results
 */
export async function analyzeImageClient(file?: File, base64Data?: string): Promise<ImageAnalysisResult> {
  try {
    // Use provided base64 data or convert file to base64
    const imageData = base64Data || (file ? await fileToBase64(file) : '');
    
    if (!imageData) {
      throw new Error('No image data provided');
    }

    // Call our API endpoint
    const response = await fetch('/api/analyze-image', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ imageData })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Image analysis failed');
    }

    const data = await response.json();

    return {
      caption: data.caption || '',
      tags: data.tags || [],
      ocr_text: data.ocr_text || []
    };

  } catch (error) {
    console.error('Client-side image analysis error:', error);
    throw error;
  }
}

/**
 * Check if the OpenAI service is available and configured
 */
export async function checkOpenAIAvailability(): Promise<boolean> {
  try {
    const response = await fetch('/api/analyze-image');
    const data = await response.json();
    return data.configured === true;
  } catch (error) {
    console.error('Error checking OpenAI availability:', error);
    return false;
  }
}
