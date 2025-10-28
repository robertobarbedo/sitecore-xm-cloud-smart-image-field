// API route to proxy image fetching to avoid CORS issues
import { NextRequest, NextResponse } from 'next/server';

interface OAuth2TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

export async function POST(request: NextRequest) {
  try {
    const { imageUrl, clientId, clientSecret } = await request.json();

    if (!imageUrl) {
      return NextResponse.json(
        { error: 'Image URL is required' },
        { status: 400 }
      );
    }

    if (!clientId || !clientSecret) {
      return NextResponse.json(
        { error: 'clientId and clientSecret are required for authentication' },
        { status: 400 }
      );
    }

    console.log('Proxying image fetch for:', imageUrl);

    // Step 1: Authenticate with Sitecore OAuth2
    console.log('Step 1: Authenticating with Sitecore OAuth2...');
    
    const tokenUrl = 'https://auth.sitecorecloud.io/oauth/token';
    const authBody = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: clientSecret,
      audience: 'https://api.sitecorecloud.io'
    });

    const tokenResponse = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': '*/*',
      },
      body: authBody.toString()
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('OAuth2 authentication failed:', errorText);
      throw new Error('Failed to authenticate with Sitecore');
    }

    const tokenData: OAuth2TokenResponse = await tokenResponse.json();
    console.log('OAuth2 authentication successful');

    // Step 2: Fetch the image with bearer token
    const response = await fetch(imageUrl, {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`
      }
    });

    if (!response.ok) {
      console.error('Image fetch failed:', response.status, response.statusText);
      throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
    }

    // Get the image as a blob
    const blob = await response.blob();
    
    // Convert blob to base64
    const arrayBuffer = await blob.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');
    
    return NextResponse.json({
      success: true,
      data: base64,
      contentType: blob.type || 'image/jpeg'
    });

  } catch (error) {
    console.error('Error proxying image:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}
