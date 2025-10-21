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
    '1. A clear, descriptive, but shorter, caption (suitable for alt text)',
    '2. A clear, descriptive longer description (suitable for use in vector search)',
    '3. The focal point of the image as normalized coordinates (0.0 to 1.0) where (0.5, 0.5) is center',
    '   - focus_x: horizontal position (0.0 = left edge, 1.0 = right edge)',
    '   - focus_y: vertical position (0.0 = top edge, 1.0 = bottom edge)',
    '   - IMPORTANT: Carefully identify the main subject or most prominent element:',
    '     * If there are people/faces, make them the focal point (prioritize faces)',
    '     * If there is a clear main subject (person, product, animal), center on it',
    '     * If text is the main element, center on the text',
    '     * Only use (0.5, 0.5) if the image is truly centered or has no clear focal point',
    '   - Calculate the actual position of the focal point, DO NOT default to center',
    '   - Be precise: examine where the main subject actually is in the frame'
  ];

  if (includeTags) {
    //promptParts.push('3. Relevant tags/keywords (as an array)');
  }

  if (includeOCR) {
    //promptParts.push('4. Any visible text in the image (OCR)');
  }

  promptParts.push('\nRespond in JSON format with keys: caption, description, focus_x, and focus_y');
  promptParts.push('focus_x and focus_y must be numbers between 0.0 and 1.0');
  //promptParts.push('If no text is visible, return an empty array for ocr_text.');
  
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
    console.log('Analyzed image result:', result);
    return {
      caption: result.caption || '',
      description: result.description || '',
      tags: result.tags || [],
      ocr_text: result.ocr_text || [],
      focus_x: result.focus_x ?? 0.5,
      focus_y: result.focus_y ?? 0.5
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
