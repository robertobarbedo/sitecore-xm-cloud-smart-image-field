// app/api/upload/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getConfig } from '@/src/lib/config';

interface OAuth2TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope?: string;
}

export async function POST(request: NextRequest) {
  try {
    // Get parameters from query string
    const { searchParams } = new URL(request.url);
    const presignedUrl = searchParams.get('presignedUrl');
    const fileType = searchParams.get('fileType') || 'application/octet-stream';
    const fileName = searchParams.get('fileName') || 'uploaded-file';
    const organizationId = searchParams.get('organizationId');
    const key = searchParams.get('key');
    
    // Get file binary from request body
    const fileBuffer = await request.arrayBuffer();

    // Validate required parameters
    if (!presignedUrl) {
      return NextResponse.json(
        { error: 'presignedUrl is required as query parameter' },
        { status: 400 }
      );
    }

    if (!organizationId || !key) {
      return NextResponse.json(
        { error: 'organizationId and key are required for authentication' },
        { status: 400 }
      );
    }

    if (!fileBuffer || fileBuffer.byteLength === 0) {
      return NextResponse.json(
        { error: 'No file binary data in request body' },
        { status: 400 }
      );
    }

    console.log('Upload handler received:', {
      fileSize: fileBuffer.byteLength,
      presignedUrlLength: presignedUrl.length,
      fileType: fileType,
      fileName: fileName
    });

    // Get config with client credentials
    const config = await getConfig(organizationId, key);
    console.warn('Config loaded for upload');
    console.warn(config);

    // Step 1: Authenticate with Sitecore OAuth2
    console.log('Step 1: Authenticating with Sitecore OAuth2...');
    
    const tokenUrl = 'https://auth.sitecorecloud.io/oauth/token';

    // Prepare OAuth2 request body with client credentials
    const authBody = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: config.clientId,
      client_secret: config.clientSecret,
      audience: 'https://api.sitecorecloud.io'
    });


    // Make OAuth2 request
    const tokenResponse = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': '*/*',
        'User-Agent': 'sitecore-smart-image-field/1.0.0',
        'Cache-Control': 'no-cache'
      },
      body: authBody.toString()
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('OAuth2 authentication failed:', {
        status: tokenResponse.status,
        statusText: tokenResponse.statusText,
        error: errorText
      });
      
      return NextResponse.json(
        { 
          error: 'Authentication failed', 
          details: `${tokenResponse.status} ${tokenResponse.statusText}`,
          message: errorText
        }, 
        { status: tokenResponse.status }
      );
    }

    const tokenData: OAuth2TokenResponse = await tokenResponse.json();
    console.log('OAuth2 authentication successful, token expires in:', tokenData.expires_in);

    // Step 2: Upload file to presigned URL with bearer token
    console.log('Step 2: Uploading file to presigned URL...');
    console.log('File buffer size:', fileBuffer.byteLength);
    console.log('Using presigned URL:', presignedUrl);

    // Create FormData to match the CURL --form format
    const formData = new FormData();
    // Create a blob from the buffer with proper file type
    const fileBlob = new Blob([fileBuffer], { type: fileType });
    formData.append('', fileBlob, fileName); // Empty key name matches CURL --form =@<file>

    // Upload to Sitecore using the presigned URL with bearer token
    const uploadResponse = await fetch(presignedUrl, {
      method: 'POST',
      body: formData,
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`
        // Don't set Content-Type - let browser set it automatically for multipart/form-data
      }
    });

    console.log('Upload response status:', {
      status: uploadResponse.status,
      statusText: uploadResponse.statusText,
      ok: uploadResponse.ok
    });

    if (!uploadResponse.ok) {
      // Get error details from Sitecore
      let errorDetails = '';
      try {
        errorDetails = await uploadResponse.text();
        console.error('Sitecore upload error details:', errorDetails);
      } catch (textError) {
        console.error('Could not read error response:', textError);
        errorDetails = 'Could not read error response';
      }

      return NextResponse.json(
        { 
          error: 'Upload to Sitecore failed',
          details: `${uploadResponse.status} ${uploadResponse.statusText}`,
          message: errorDetails
        },
        { status: uploadResponse.status }
      );
    }

    // Get the successful response from Sitecore
    const sitecoreResponse = await uploadResponse.json();
    console.log('Upload successful, Sitecore response:', sitecoreResponse);

    return NextResponse.json({
      success: true,
      itemId: sitecoreResponse?.Id ?? null,
      message: 'File uploaded successfully to Sitecore',
      sitecoreResponse: sitecoreResponse
    });

  } catch (error) {
    console.error('Upload handler error:', error);
    
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  // For testing purposes, return API info
  return NextResponse.json({
    message: 'Sitecore Upload API',
    description: 'POST with presignedUrl and file to upload to Sitecore',
    methods: ['POST']
  });
}