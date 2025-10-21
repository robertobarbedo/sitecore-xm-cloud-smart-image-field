# OpenAI Image Analysis Integration

This module provides integration with OpenAI's GPT-4o mini model to automatically analyze uploaded images and extract metadata.

## Features

- **Caption Generation**: Generates descriptive captions suitable for alt text
- **OCR Text Extraction**: Extracts any visible text from images
- **Tag Generation**: Identifies relevant tags/keywords (available but not currently used)
- **On-Demand Analysis**: User triggers analysis via "Fill With AI" button in Metadata tab

## Setup

### 1. Install OpenAI SDK (if not already installed)

```bash
npm install openai
```

### 2. Configure Environment Variables

Add your OpenAI API key to your `.env.local` file:

```env
OPENAI_API_KEY=your_openai_api_key_here
```

## Architecture

### Server-Side Components

- **`config.ts`**: Configuration management and API key validation
- **`image-analyzer.ts`**: Core image analysis logic using OpenAI API
- **`types.ts`**: TypeScript type definitions

### Client-Side Components

- **`client.ts`**: Client-side wrapper functions for components to use

### API Route

- **`/api/analyze-image`**: Server-side API endpoint that securely calls OpenAI
  - **POST**: Analyzes an image (expects `{ imageData: string }` in body)
  - **GET**: Check service availability and configuration

## Usage

### In React Components

```typescript
import { analyzeImageClient } from '@/src/lib/openai/client';

// In ImageMetadata component - triggered by "Fill With AI" button
const handleFillWithAI = async () => {
  setIsAnalyzing(true);
  
  try {
    // Convert image URL to File object
    const response = await fetch(selectedImage.previewUrl);
    const blob = await response.blob();
    const file = new File([blob], 'image.jpg', { type: blob.type });
    
    // Analyze the image
    const result = await analyzeImageClient(file);
    
    // Update metadata fields
    setAltText(result.caption || '');
    setDescription(result.ocr_text.join(' ') || '');
    
    console.log('AI Analysis:', result);
  } catch (error) {
    console.error('Analysis failed:', error);
  } finally {
    setIsAnalyzing(false);
  }
};
```

### Check Availability

```typescript
import { checkOpenAIAvailability } from '@/src/lib/openai/client';

const isAvailable = await checkOpenAIAvailability();
if (isAvailable) {
  // OpenAI is configured and ready
}
```

## Integration with ImageMetadata

The ImageMetadata component provides on-demand AI analysis via a button:

1. User uploads/selects an image
2. User navigates to Metadata tab
3. User clicks **"Fill With AI"** button
4. Component fetches the image from preview URL
5. **OpenAI analyzes the image**
6. AI-generated caption → `altText` field
7. AI-generated OCR text → `description` field
8. User can review and edit the AI-generated content before saving

This approach gives users control over when AI analysis occurs and allows them to review/edit the results.

## Data Mapping

| OpenAI Field | Target Field | Usage |
|--------------|--------------|-------|
| `caption` | Alt Text | Used for image accessibility |
| `ocr_text[]` | Description | Extracted text content (joined) |
| `tags[]` | _(Not used)_ | Available for future features |

## Error Handling

The integration provides user-friendly error handling:

- If OpenAI API key is not configured, the button is disabled
- If analysis fails, user receives an alert with details
- All errors are logged to console for debugging
- Failed analysis doesn't affect image upload or save operations

## Model Details

- **Model**: GPT-4o mini
- **Max Tokens**: 500 (configurable)
- **Response Format**: JSON
- **Capabilities**: Vision, OCR, object recognition

## Cost Considerations

- GPT-4o mini is optimized for cost-effectiveness
- Each image analysis costs approximately $0.001-0.002
- Consider implementing rate limiting for production use

## Security

- API key is stored server-side only (environment variable)
- Client-side code calls a Next.js API route
- No API key exposure to the browser
- Image data is transmitted as base64

## Future Enhancements

- Use `tags[]` for automatic categorization
- Multi-language support for captions
- Confidence scores for AI suggestions
- User review/edit of AI-generated content
- Batch processing for multiple images
