// components/ImageSelector.tsx

"use client";

import { useState, useRef, useCallback } from 'react';
import { ClientSDK, ApplicationContext } from '@sitecore-marketplace-sdk/client';
import { getConfig } from '@/src/lib/config';
import { createFolder } from '@/src/lib/folder-manager';

interface ImageSelectorProps {
  client: ClientSDK;
}

interface UploadedImageData {
  path: string;
  itemPath: string;
  itemId: string;
}

export function ImageSelector({ client }: ImageSelectorProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string>('');
  const [uploadedImage, setUploadedImage] = useState<UploadedImageData | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sanitizeFileName = (fileName: string): string => {
    // Remove file extension
    const nameWithoutExt = fileName.replace(/\.[^/.]+$/, '');
    // Keep only letters and numbers
    return nameWithoutExt.replace(/[^a-zA-Z0-9]/g, '');
  };

  const generateFolderPath = (): string => {
    const config = getConfig(''); // Pass empty string for organization ID as it's hardcoded
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hour = String(now.getHours()).padStart(2, '0');
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    
    return `${config.baseFolder}/${year}/${month}/${day}/${hour}/${randomSuffix}`;
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
    // Escape the presigned URL for use as a query parameter
    const encodedPresignedUrl = encodeURIComponent(presignedUrl);
    // Also encode the file type and name
    const encodedFileType = encodeURIComponent(file.type);
    const encodedFileName = encodeURIComponent(file.name);
    
    // Convert file to ArrayBuffer for binary upload
    const fileBuffer = await file.arrayBuffer();

    const response = await fetch(`/api/upload?presignedUrl=${encodedPresignedUrl}&fileType=${encodedFileType}&fileName=${encodedFileName}`, {
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

      // Generate folder path and sanitize file name
      const folderPath = generateFolderPath();
      const sanitizedFileName = sanitizeFileName(file.name);
      const itemPath = `${folderPath}/${sanitizedFileName}`;

      setUploadStatus('Preparing upload...');
      
      // Create the folder structure
      await createFolder(client, folderPath);

      setUploadStatus('Getting upload URL...');
      
      // Get presigned URL
      const presignedUrl = await getPresignedUrl(itemPath);

      setUploadStatus('Uploading image...');
      
      // Upload the file
      const itemId = await uploadToPresignedUrl(file, presignedUrl);

      // Set the uploaded image data
      const imageData: UploadedImageData = {
        path: folderPath,
        itemPath: itemPath,
        itemId: itemId,
      };

      setUploadedImage(imageData);
      setUploadStatus('Upload completed successfully!');

    } catch (error) {
      console.error('Upload error:', error);
      setUploadStatus(`Upload failed 2: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async () => {
    if (!uploadedImage) {
      alert('No image to save');
      return;
    }

    try {
      const dataToSave = JSON.stringify(uploadedImage);
      await client.setValue(dataToSave, true);
      alert('Image saved successfully!');
    } catch (error) {
      console.error('Save error:', error);
      alert(`Failed to save: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
      <div className="header">
        {uploadedImage && (
          <button onClick={handleSave} className="save-button">
            Save
          </button>
        )}
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
              <div className="upload-overlay">
                {isUploading ? (
                  <div className="upload-progress">
                    <div className="spinner"></div>
                    <div>{uploadStatus}</div>
                  </div>
                ) : (
                  <div className="upload-success">
                    ✓ {uploadStatus}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="drop-zone-content">
              <div className="upload-icon">📁</div>
              <div className="upload-text">
                <div>Drag and drop an image here</div>
                <div className="upload-subtext">or click to select a file</div>
              </div>
            </div>
          )}
        </div>

        {uploadStatus && !previewUrl && (
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
          padding: 20px;
          max-width: 600px;
          margin: 0 auto;
        }
        
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }
        
        .header h2 {
          color: #333;
          margin: 0;
        }
        
        .save-button {
          background-color: #007acc;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 600;
          transition: background-color 0.2s;
        }
        
        .save-button:hover {
          background-color: #005a9f;
        }
        
        .upload-section {
          margin-top: 20px;
        }
        
        .drop-zone {
          border: 2px dashed #ccc;
          border-radius: 8px;
          padding: 40px;
          text-align: center;
          cursor: pointer;
          transition: all 0.2s;
          background-color: #fafafa;
          position: relative;
          min-height: 200px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .drop-zone.drag-over {
          border-color: #007acc;
          background-color: #f0f8ff;
        }
        
        .drop-zone.uploading {
          cursor: not-allowed;
        }
        
        .drop-zone-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
        }
        
        .upload-icon {
          font-size: 48px;
          opacity: 0.6;
        }
        
        .upload-text {
          color: #666;
        }
        
        .upload-subtext {
          font-size: 14px;
          color: #999;
          margin-top: 4px;
        }
        
        .preview-container {
          position: relative;
          max-width: 100%;
          max-height: 300px;
        }
        
        .preview-image {
          max-width: 100%;
          max-height: 300px;
          object-fit: contain;
          border-radius: 4px;
        }
        
        .upload-overlay {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          background: rgba(0, 0, 0, 0.8);
          color: white;
          padding: 10px;
          border-radius: 0 0 4px 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
        }
        
        .upload-progress {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        
        .upload-success {
          color: #4caf50;
          font-weight: 600;
        }
        
        .spinner {
          width: 16px;
          height: 16px;
          border: 2px solid #f3f3f3;
          border-top: 2px solid #007acc;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        .status-message {
          margin-top: 16px;
          padding: 12px;
          background-color: #f0f8ff;
          border-left: 4px solid #007acc;
          border-radius: 4px;
          color: #333;
        }
      `}</style>
    </div>
  );
}