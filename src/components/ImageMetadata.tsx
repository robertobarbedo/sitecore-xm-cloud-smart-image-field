// components/ImageMetadata.tsx

"use client";

import { useState, useEffect } from 'react';
import { ClientSDK } from '@sitecore-marketplace-sdk/client';
import { getConfig } from '@/src/lib/config';
import { getUrlParams } from '@/src/lib/supabase-client';
import { analyzeImageClient } from '@/src/lib/openai/client';

interface SelectedImage {
  path: string;
  itemPath: string;
  itemId: string;
  previewUrl?: string;
  altText?: string;
  description?: string;
  mimeType?: string;
  focusX?: number;
  focusY?: number;
}

interface ImageMetadataProps {
  client: ClientSDK;
  selectedImage: SelectedImage | null;
  onMetadataChange: (altText: string, description: string, focusX?: number, focusY?: number) => void;
  autoCaption?: boolean;
  onProcessingChange?: (isProcessing: boolean) => void;
}

export function ImageMetadata({ client, selectedImage, onMetadataChange, autoCaption, onProcessingChange }: ImageMetadataProps) {
  const [altText, setAltText] = useState('');
  const [description, setDescription] = useState('');
  const [focusX, setFocusX] = useState(0.5);
  const [focusY, setFocusY] = useState(0.5);
  const [previewHost, setPreviewHost] = useState<string>('');
  const [organizationId, setOrganizationId] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiError, setAiError] = useState<string>('');

  // Load preview host and organization ID
  useEffect(() => {
    const loadConfig = async () => {
      const params = getUrlParams();
      if (params) {
        setOrganizationId(params.organizationId);
        try {
          const config = await getConfig(params.organizationId, params.key);
          setPreviewHost(config.previewHost);
        } catch (error) {
          console.error('Error loading config:', error);
        }
      }
    };
    loadConfig();
  }, []);

  // Load metadata when selectedImage changes
  useEffect(() => {
    if (selectedImage) {
      setAltText(selectedImage.altText || '');
      setDescription(selectedImage.description || '');
      setFocusX(selectedImage.focusX ?? 0.5);
      setFocusY(selectedImage.focusY ?? 0.5);
      setAiError(''); // Clear error when image changes
    }
  }, [selectedImage]);

  // Auto-trigger AI caption when autoCaption is enabled
  useEffect(() => {
    if (autoCaption && selectedImage && !selectedImage.altText && !isAnalyzing) {
      console.log('Auto-triggering AI caption');
      handleFillWithAI();
    }
  }, [autoCaption, selectedImage]);

  const handleAltTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setAltText(value);
    onMetadataChange(value, description, focusX, focusY);
  };

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setDescription(value);
    onMetadataChange(altText, value, focusX, focusY);
  };

  const handleFillWithAI = async () => {
    if (!selectedImage?.previewUrl) {
      setAiError('No image available to analyze');
      return;
    }

    setIsAnalyzing(true);
    setAiError(''); // Clear previous errors
    onProcessingChange?.(true); // Notify parent
    
    try {
      console.log('Fetching image for AI analysis:', selectedImage.previewUrl);
      
      // Get URL params for authentication
      const params = getUrlParams();
      if (!params) {
        throw new Error('Missing URL parameters for authentication');
      }
      
      // Use proxy to fetch image with OAuth2 authentication
      const proxyResponse = await fetch('/api/proxy-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          imageUrl: selectedImage.previewUrl,
          organizationId: params.organizationId,
          key: params.key
        }),
      });

      if (!proxyResponse.ok) {
        throw new Error('Failed to fetch image through proxy');
      }

      const proxyData = await proxyResponse.json();
      
      if (!proxyData.success) {
        throw new Error(proxyData.error || 'Failed to fetch image');
      }

      // Get base64 data and use stored MIME type from the field
      const base64Data = proxyData.data;
      const contentType = selectedImage.mimeType || proxyData.contentType || 'image/jpeg';
      
      // Format as data URI for OpenAI
      const dataUri = `data:${contentType};base64,${base64Data}`;
      
      console.log('Image fetched and converted, analyzing with AI...');
      
      // Analyze the image - pass base64 data directly
      const aiResult = await analyzeImageClient(undefined, dataUri);
      
      // Update fields with AI results
      const newAltText = aiResult.caption || '';
      const newDescription = aiResult.description || '';
      const newFocusX = aiResult.focus_x ?? 0.5;
      const newFocusY = aiResult.focus_y ?? 0.5;
      
      setAltText(newAltText);
      setDescription(newDescription);
      setFocusX(newFocusX);
      setFocusY(newFocusY);
      onMetadataChange(newAltText, newDescription, newFocusX, newFocusY);
      
      console.log('AI Analysis complete:', aiResult);
    } catch (error) {
      console.error('AI analysis failed:', error);
      
      // Extract user-friendly error message
      let errorMessage = 'Failed to analyze image with AI.';
      
      if (error instanceof Error) {
        // Try to extract OpenAI error message
        const errorString = error.message;
        
        // Look for OpenAI API error format
        const apiErrorMatch = errorString.match(/OpenAI API error: \d+ - ({.*})/);
        if (apiErrorMatch) {
          try {
            const errorData = JSON.parse(apiErrorMatch[1]);
            if (errorData.error?.message) {
              errorMessage = errorData.error.message;
            }
          } catch (parseError) {
            // If parsing fails, use the full error message
            errorMessage = errorString;
          }
        } else {
          errorMessage = errorString;
        }
      }
      
      setAiError(errorMessage);
    } finally {
      setIsAnalyzing(false);
      onProcessingChange?.(false); // Notify parent
    }
  };

  if (!selectedImage) {
    return (
      <div className="image-metadata-container">
        <div className="no-image-message">
          <p>No image selected. Please upload or find an image first.</p>
        </div>
        
        <style jsx>{`
          .image-metadata-container {
            padding: 16px;
          }
          
          .no-image-message {
            color: #666;
            font-size: 13px;
            padding: 16px;
          }
          
          .no-image-message p {
            margin: 0;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="image-metadata-container">
      {selectedImage.previewUrl && (
        <div className="image-preview">
          <img src={selectedImage.previewUrl} alt={altText || 'Selected image'} />
        </div>
      )}

      <div className="metadata-form">
        <div className="form-group button-group">
          <button 
            className="ai-fill-button"
            onClick={handleFillWithAI}
            disabled={isAnalyzing || !selectedImage?.previewUrl}
          >
            <svg 
              className="ai-icon" 
              width="16" 
              height="16" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
              <path d="M2 17l10 5 10-5"></path>
              <path d="M2 12l10 5 10-5"></path>
            </svg>
            {isAnalyzing ? 'Analyzing...' : 'Fill With AI'}
          </button>
        </div>

        {aiError && (
          <div className="ai-error-message">
            <svg 
              className="error-icon" 
              width="16" 
              height="16" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            {aiError}
          </div>
        )}

        <div className="form-group">
          <label htmlFor="altText">Image alt text</label>
          <input
            id="altText"
            type="text"
            value={altText}
            onChange={handleAltTextChange}
            placeholder=""
            className="form-input"
          />
        </div>

        <div className="form-group">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            value={description}
            onChange={handleDescriptionChange}
            placeholder=""
            className="form-textarea"
            rows={4}
          />
        </div>

        {/* Hidden inputs for focal point data */}
        <input type="hidden" name="focusX" value={focusX} />
        <input type="hidden" name="focusY" value={focusY} />

        <div className="image-info">
          <div className="info-item">
            <span className="info-label">Image path</span>
            {previewHost && organizationId ? (
              <>
                <a
                  href={`${previewHost}sitecore/shell/Applications/Content%20Editor.aspx?sc_bw=1&organization=${organizationId}&id=${selectedImage.itemId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="info-value-link"
                >
                  {selectedImage.itemPath}
                  <svg 
                    className="external-icon" 
                    width="12" 
                    height="12" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2"
                  >
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                    <polyline points="15 3 21 3 21 9"></polyline>
                    <line x1="10" y1="14" x2="21" y2="3"></line>
                  </svg>
                </a>
                <span className="path-hint">(Ctrl + Click to Open Content Editor in a New Tab)</span>
              </>
            ) : (
              <span className="info-value">{selectedImage.itemPath}</span>
            )}
          </div>
          <div className="info-item">
            <span className="info-label">Item ID</span>
            <span className="info-value">{selectedImage.itemId}</span>
          </div>
        </div>
      </div>
      
      <style jsx>{`
        .image-metadata-container {
          padding: 16px;
        }

        .image-preview {
          margin-bottom: 16px;
          border: 1px solid #e5e5e5;
          background-color: #fafafa;
          padding: 12px;
          text-align: center;
        }

        .image-preview img {
          max-width: 100%;
          max-height: 200px;
          object-fit: contain;
        }

        .metadata-form {
          background-color: #ffffff;
        }

        .form-group {
          margin-bottom: 16px;
        }

        .button-group {
          display: flex;
          justify-content: flex-end;
          margin-bottom: 20px;
        }

        .form-group label {
          display: block;
          color: #333;
          font-weight: 400;
          margin-bottom: 6px;
          font-size: 13px;
        }

        .form-input,
        .form-textarea {
          width: 100%;
          padding: 6px 8px;
          border: 1px solid #d0d0d0;
          border-radius: 2px;
          font-size: 13px;
          font-family: inherit;
          transition: border-color 0.2s;
          background-color: #ffffff;
        }

        .form-input:focus,
        .form-textarea:focus {
          outline: none;
          border-color: #1e90ff;
        }

        .form-textarea {
          resize: vertical;
          min-height: 80px;
        }

        .ai-fill-button {
          background: linear-gradient(135deg, #7C3AED 0%, #6366F1 100%);
          color: white;
          border: none;
          padding: 8px 20px;
          border-radius: 20px;
          cursor: pointer;
          font-size: 13px;
          font-weight: 500;
          transition: all 0.2s;
          box-shadow: 0 2px 8px rgba(124, 58, 237, 0.3);
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .ai-icon {
          flex-shrink: 0;
        }

        .ai-fill-button:hover:not(:disabled) {
          background: linear-gradient(135deg, #6D28D9 0%, #4F46E5 100%);
          box-shadow: 0 4px 12px rgba(124, 58, 237, 0.4);
          transform: translateY(-1px);
        }

        .ai-fill-button:disabled {
          background: #e0e0e0;
          color: #999;
          cursor: not-allowed;
          box-shadow: none;
          transform: none;
        }

        .ai-error-message {
          background-color: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 4px;
          padding: 12px;
          margin-bottom: 16px;
          display: flex;
          align-items: flex-start;
          gap: 8px;
          font-size: 13px;
          color: #dc2626;
          line-height: 1.5;
        }

        .error-icon {
          flex-shrink: 0;
          margin-top: 2px;
        }

        .image-info {
          margin-top: 20px;
          padding-top: 16px;
          border-top: 1px solid #e5e5e5;
        }

        .info-item {
          margin-bottom: 12px;
          font-size: 13px;
        }

        .info-label {
          display: block;
          color: #666;
          font-weight: 400;
          margin-bottom: 4px;
        }

        .info-value {
          color: #333;
          word-break: break-all;
          font-size: 12px;
        }

        .info-value-link {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          color: #1e90ff;
          text-decoration: none;
          word-break: break-all;
          font-size: 12px;
          transition: color 0.2s;
        }

        .info-value-link:hover {
          color: #0066cc;
          text-decoration: underline;
        }

        .external-icon {
          flex-shrink: 0;
          margin-left: 2px;
          opacity: 0.7;
        }

        .info-value-link:hover .external-icon {
          opacity: 1;
        }

        .path-hint {
          display: block;
          font-size: 11px;
          color: #999;
          margin-top: 4px;
          font-style: italic;
        }
      `}</style>
    </div>
  );
}
