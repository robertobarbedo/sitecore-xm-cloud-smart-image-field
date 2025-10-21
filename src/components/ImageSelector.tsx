// components/ImageSelector.tsx

"use client";

import { useState, useRef, useCallback, useEffect } from 'react';
import { ClientSDK, ApplicationContext } from '@sitecore-marketplace-sdk/client';
import { getConfig } from '@/src/lib/config';
import { createFolder } from '@/src/lib/folder-manager';
import { getUrlParams } from '@/src/lib/supabase-client';
import { RecommendedInfoPanel } from './RecommendedInfoPanel';

interface ImageSelectorProps {
  client: ClientSDK;
  onImageSelected?: (imageData: UploadedImageData) => void;
}

interface UploadedImageData {
  path: string;
  itemPath: string;
  itemId: string;
  previewUrl?: string;
  altText?: string;
  description?: string;
  imageName?: string;
  imageExtension?: string;
  width?: number;
  height?: number;
  sizeKb?: number;
  aspectRatio?: string;
  mimeType?: string;
  focusX?: number;
  focusY?: number;
}

export function ImageSelector({ client, onImageSelected }: ImageSelectorProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string>('');
  const [uploadedImage, setUploadedImage] = useState<UploadedImageData | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [baseFolder, setBaseFolder] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load base folder once on mount
  useEffect(() => {
    const loadBaseFolder = async () => {
      const params = getUrlParams();
      if (!params) return;
      
      try {
        const config = await getConfig(params.organizationId, params.key);
        setBaseFolder(config.baseFolder);
      } catch (error) {
        console.error('Error loading base folder:', error);
      }
    };
    
    loadBaseFolder();
  }, []);

  const sanitizeFileName = (fileName: string): string => {
    // Remove file extension
    const nameWithoutExt = fileName.replace(/\.[^/.]+$/, '');
    // Keep only letters and numbers
    return nameWithoutExt.replace(/[^a-zA-Z0-9]/g, '');
  };

  const generateFolderPath = (): string => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hour = String(now.getHours()).padStart(2, '0');
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    
    return `${baseFolder}/${year}/${month}/${day}/${hour}/${randomSuffix}`;
  };

  /**
   * Calculate the greatest common divisor (GCD) using Euclidean algorithm
   */
  const gcd = (a: number, b: number): number => {
    return b === 0 ? a : gcd(b, a % b);
  };

  /**
   * Calculate the aspect ratio from width and height
   * Returns a string like "16:9" or "4:3"
   */
  const calculateAspectRatio = (width: number, height: number): string => {
    const divisor = gcd(width, height);
    const ratioWidth = width / divisor;
    const ratioHeight = height / divisor;
    return `${ratioWidth}:${ratioHeight}`;
  };

  /**
   * Load image dimensions from file
   */
  const getImageDimensions = (file: File): Promise<{ width: number; height: number }> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        resolve({ width: img.width, height: img.height });
      };
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  };



  const getPresignedUrl = async (itemPath: string): Promise<string> => {
    console.log('Getting presigned URL for path:', itemPath);
    
    const appContext = await client.query("application.context");
    const sitecoreContextId = (appContext.data as ApplicationContext as any).resourceAccess?.[0]?.context?.preview;
    
    console.log('Sitecore Context ID:', sitecoreContextId);
    
    if (!sitecoreContextId) {
      throw new Error("Sitecore Context ID not found");
    }
    
    let parsedItemPath = itemPath;
    if (itemPath.toLowerCase().startsWith('/sitecore/media library/')) {
      parsedItemPath = itemPath.substring('/sitecore/media library/'.length);
    }
    
    console.log('Parsed item path:', parsedItemPath);
    
    const graphqlMutation = {
      query: `
        mutation UploadMedia {
          uploadMedia(
            input: { 
              itemPath: "${parsedItemPath}"
              language: "en"
              overwriteExisting: true 
            }
          ) {
            presignedUploadUrl
          }
        }
      `
    };

    console.log('GraphQL mutation:', graphqlMutation);

    const response: any = await client.mutate("xmc.authoring.graphql", {
      params: {
        query: { sitecoreContextId },
        body: graphqlMutation,
      },
    });

    console.log('GraphQL response:', response);

    const presignedUrl = response?.data?.data?.uploadMedia?.presignedUploadUrl;
    if (!presignedUrl) {
      console.error('Error getting presigned URL:', response);
      console.error('Full response structure:', JSON.stringify(response, null, 2));
      throw new Error("Failed to get presigned URL");
    }

    console.log('Got presigned URL:', presignedUrl);
    return presignedUrl;
  };

  const uploadToPresignedUrl = async (file: File, presignedUrl: string): Promise<string> => {
    // Get URL params for authentication
    const params = getUrlParams();
    if (!params) {
      throw new Error('Missing URL parameters for authentication');
    }

    // Escape the presigned URL for use as a query parameter
    const encodedPresignedUrl = encodeURIComponent(presignedUrl);
    // Also encode the file type and name
    const encodedFileType = encodeURIComponent(file.type);
    const encodedFileName = encodeURIComponent(file.name);
    const encodedOrgId = encodeURIComponent(params.organizationId);
    const encodedKey = encodeURIComponent(params.key);
    
    // Convert file to ArrayBuffer for binary upload
    const fileBuffer = await file.arrayBuffer();

    const response = await fetch(`/api/upload?presignedUrl=${encodedPresignedUrl}&fileType=${encodedFileType}&fileName=${encodedFileName}&organizationId=${encodedOrgId}&key=${encodedKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/octet-stream'
      },
      body: fileBuffer
    });

    const result = await response.json();
    console.log('mario Upload response:', result);
    
    if (result.success && result.itemId) {
      return result.itemId;
    } else {
      throw new Error(result.error || 'Upload failed - no item ID returned');
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    setIsUploading(true);
    setUploadStatus('Preparing upload...');

    try {
      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      setPreviewUrl(previewUrl);

      // Get image dimensions
      setUploadStatus('Reading image properties...');
      const dimensions = await getImageDimensions(file);
      
      // Calculate file size in KB
      const sizeKb = Math.round((file.size / 1024) * 100) / 100;
      
      // Calculate aspect ratio
      const aspectRatio = calculateAspectRatio(dimensions.width, dimensions.height);
      
      console.log('Image properties:', {
        width: dimensions.width,
        height: dimensions.height,
        sizeKb,
        aspectRatio
      });

      // Extract file name and extension
      const fileName = file.name;
      const lastDotIndex = fileName.lastIndexOf('.');
      const fileExtension = lastDotIndex !== -1 ? fileName.substring(lastDotIndex + 1).toLowerCase() : '';
      const fileNameWithoutExt = lastDotIndex !== -1 ? fileName.substring(0, lastDotIndex) : fileName;

      // Generate folder path and sanitize file name
      const folderPath = generateFolderPath();
      const sanitizedFileName = sanitizeFileName(file.name);
      const itemPath = `${folderPath}/${sanitizedFileName}`;

      setUploadStatus('Creating folder structure...');
      
      // Create the folder structure
      await createFolder(client, folderPath);

      setUploadStatus('Getting upload URL...');
      
      // Get presigned URL
      const presignedUrl = await getPresignedUrl(itemPath);

      setUploadStatus('Uploading image...');
      
      // Upload the file
      const itemId = await uploadToPresignedUrl(file, presignedUrl);

      // Construct the proper preview URL using preview host + path
      const params = getUrlParams();
      let actualPreviewUrl = previewUrl; // Fallback to blob URL
      if (params && baseFolder) {
        try {
          const config = await getConfig(params.organizationId, params.key);
          // Convert itemPath to preview URL: /sitecore/media library/... -> https://host/-media/...
          actualPreviewUrl = itemPath.replace(/^\/sitecore\/media library\//i, config.previewHost + '-/media/') + (fileExtension ? `.${fileExtension}` : '');
        } catch (error) {
          console.error('Error getting config for preview URL:', error);
        }
      }

      // Set the uploaded image data
      const imageData: UploadedImageData = {
        path: folderPath,
        itemPath: itemPath,
        itemId: itemId,
        previewUrl: actualPreviewUrl, // Use the actual preview host URL
        altText: '', // Will be filled manually or via AI button
        description: '', // Will be filled manually or via AI button
        imageName: fileNameWithoutExt,
        imageExtension: fileExtension,
        width: dimensions.width,
        height: dimensions.height,
        sizeKb: sizeKb,
        aspectRatio: aspectRatio,
        mimeType: file.type
      };

      setUploadedImage(imageData);
      setUploadStatus('Upload completed successfully!');

      // Notify parent component about the selected image
      if (onImageSelected) {
        onImageSelected(imageData);
      }

    } catch (error) {
      console.error('Upload error:', error);
      setUploadStatus(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsUploading(false);
    }
  };



  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  }, []);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="image-selector-container">
      {/* Show recommendations and validation - centered */}
      <div className="recommendations-wrapper">
        <RecommendedInfoPanel uploadedImage={uploadedImage} />
      </div>

      <div className="upload-section">
        <div 
          className={`drop-zone ${isDragOver ? 'drag-over' : ''} ${isUploading ? 'uploading' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleClick}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileInputChange}
            style={{ display: 'none' }}
          />
          
          {previewUrl ? (
            <div className="preview-container">
              <img src={previewUrl} alt="Preview" className="preview-image" />
              {isUploading && (
                <div className="upload-progress">
                  <div className="spinner"></div>
                  <span>{uploadStatus}</span>
                </div>
              )}
              {!isUploading && uploadStatus && (
                <div className="upload-success">
                  ✓ Uploaded successfully
                </div>
              )}
            </div>
          ) : (
            <div className="drop-zone-content">
              <div className="upload-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="17 8 12 3 7 8"/>
                  <line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
              </div>
              <div className="upload-text">
                Browse media library or drop an image here
              </div>
            </div>
          )}
        </div>

        {uploadStatus && !previewUrl && isUploading && (
          <div className="status-message">
            {uploadStatus}
          </div>
        )}
      </div>

      {/* Hidden input to store the value for Sitecore field */}
      <input 
        type="hidden" 
        value={uploadedImage ? JSON.stringify(uploadedImage) : ''} 
        readOnly 
      />

      <style jsx>{`
        .image-selector-container {
          padding: 16px;
        }

        .recommendations-wrapper {
          display: flex;
          justify-content: center;
          margin-bottom: 12px;
        }
        
        .upload-section {
          margin-top: 0;
        }
        
        .drop-zone {
          border: 1px dashed #d0d0d0;
          border-radius: 2px;
          padding: 24px;
          text-align: center;
          cursor: pointer;
          transition: all 0.2s;
          background-color: #fafafa;
          position: relative;
          min-height: 120px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .drop-zone.drag-over {
          border-color: #1e90ff;
          background-color: #f0f8ff;
        }
        
        .drop-zone.uploading {
          cursor: not-allowed;
        }
        
        .drop-zone-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
        }
        
        .upload-icon {
          color: #999;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .upload-text {
          color: #666;
          font-size: 13px;
        }
        
        .preview-container {
          position: relative;
          max-width: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
        }
        
        .preview-image {
          max-width: 100%;
          max-height: 200px;
          object-fit: contain;
        }
        
        .upload-progress {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          color: #666;
        }
        
        .upload-success {
          color: #4caf50;
          font-size: 12px;
        }
        
        .spinner {
          width: 14px;
          height: 14px;
          border: 2px solid #e0e0e0;
          border-top: 2px solid #1e90ff;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        .status-message {
          margin-top: 12px;
          padding: 8px;
          font-size: 12px;
          color: #666;
        }
      `}</style>
    </div>
  );
}