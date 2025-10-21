// app/api/analyze-image/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { analyzeImage } from '@/src/lib/openai/image-analyzer';
import { isOpenAIConfigured } from '@/src/lib/openai/config';

export async function POST(request: NextRequest) {
  try {
    // Check if OpenAI is configured
    if (!isOpenAIConfigured()) {
      return NextResponse.json(
        { 
          error: 'OpenAI not configured',
          message: 'OPENAI_API_KEY environment variable is not set'
        },
        { status: 503 }
      );
    }

    // Get the image data from the request
    const body = await request.json();
    const { imageData } = body;

    if (!imageData) {
      return NextResponse.json(
        { error: 'Missing imageData in request body' },
        { status: 400 }
      );
    }

    console.log('Analyzing image with OpenAI...');

    // Analyze the image
    const result = await analyzeImage(imageData, {
      includeOCR: true,
      includeTags: true,
      maxTokens: 500
    });

    console.log('Image analysis complete:', result);

    return NextResponse.json({
      success: true,
      ...result
    });

  } catch (error) {
    console.error('Image analysis error:', error);
    
    return NextResponse.json(
      {
        error: 'Image analysis failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  // Check if OpenAI is configured
  const configured = isOpenAIConfigured();
  
  return NextResponse.json({
    service: 'OpenAI Image Analysis',
    configured,
    model: 'gpt-4o-mini',
    message: configured 
      ? 'Service is ready' 
      : 'Service not configured - OPENAI_API_KEY missing'
  });
}
