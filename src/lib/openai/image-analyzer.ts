// lib/openai/image-analyzer.ts

import { ImageAnalysisResult, ImageAnalysisOptions } from './types';
import { getOpenAIConfig } from './config';

/**
 * Analyze an image using OpenAI's GPT-4o mini model
 * @param imageData - Base64 encoded image data or image URL
 * @param options - Analysis options
 * @returns Image analysis results including caption, tags, and OCR text
 */
export async function analyzeImage(
  imageData: string,
  options: ImageAnalysisOptions = {}
): Promise<ImageAnalysisResult> {
  const config = getOpenAIConfig();
  
  const {
    includeOCR = true,
    includeTags = true,
    maxTokens = 500
  } = options;

  // Construct the prompt based on options
  const promptParts = [
    'Analyze this image and provide:',
    '1. A clear, descriptive caption (suitable for alt text)',
  ];

  if (includeTags) {
    promptParts.push('2. Relevant tags/keywords (as an array)');
  }

  if (includeOCR) {
    promptParts.push('3. Any visible text in the image (OCR)');
  }

  promptParts.push('\nRespond in JSON format with keys: caption, tags, ocr_text');
  promptParts.push('If no text is visible, return an empty array for ocr_text.');
  
  const prompt = promptParts.join('\n');

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`
      },
      body: JSON.stringify({
        model: config.model,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: prompt
              },
              {
                type: 'image_url',
                image_url: {
                  url: imageData.startsWith('data:') ? imageData : `data:image/jpeg;base64,${imageData}`
                }
              }
            ]
          }
        ],
        max_tokens: maxTokens,
        response_format: { type: 'json_object' }
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`OpenAI API error: ${response.status} - ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
      throw new Error('No content in OpenAI response');
    }

    // Parse the JSON response
    const result: ImageAnalysisResult = JSON.parse(content);

    // Ensure all required fields exist
    return {
      caption: result.caption || '',
      tags: result.tags || [],
      ocr_text: result.ocr_text || []
    };

  } catch (error) {
    console.error('Error analyzing image with OpenAI:', error);
    throw error;
  }
}

/**
 * Convert a File or Blob to base64 string
 * @param file - The file to convert
 * @returns Base64 encoded string
 */
export async function fileToBase64(file: File | Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
