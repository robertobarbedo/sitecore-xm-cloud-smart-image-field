// components/ImageCropping.tsx

"use client";

import { useState, useEffect, useRef, useCallback } from 'react';

interface CropConfig {
  label: string;
  width: number;
  height: number;
}

interface CropConfigs {
  [key: string]: CropConfig;
}

interface SelectedImage {
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

interface CroppedVersion {
  path: string;
  width: number;
  height: number;
}

interface ImageCroppingProps {
  selectedImage: SelectedImage | null;
  onFocalPointChange?: (focusX: number, focusY: number) => void;
  onCroppedVersionsChange?: (croppedVersions: { [key: string]: CroppedVersion }) => void;
  client?: any;
  autoCrop?: boolean;
  onProcessingChange?: (isProcessing: boolean) => void;
}

interface FocalPoint {
  x: number; // percentage 0-1
  y: number; // percentage 0-1
}

export function ImageCropping({ selectedImage, onFocalPointChange, onCroppedVersionsChange, client, autoCrop, onProcessingChange }: ImageCroppingProps) {
  const [cropConfigs, setCropConfigs] = useState<CropConfigs>({});
  const imageRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [croppedImages, setCroppedImages] = useState<{ [key: string]: string }>({});
  const [focalPoint, setFocalPoint] = useState<FocalPoint>({ 
    x: selectedImage?.focusX ?? 0.5, 
    y: selectedImage?.focusY ?? 0.5 
  });
  const [imageNaturalDimensions, setImageNaturalDimensions] = useState({ width: 0, height: 0 });
  const [proxiedImageUrl, setProxiedImageUrl] = useState<string>('');
  const [isLoadingImage, setIsLoadingImage] = useState(false);
  const [croppedVersionPaths, setCroppedVersionPaths] = useState<{ [key: string]: CroppedVersion }>({});
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string>('');
  const [hasAutoUploaded, setHasAutoUploaded] = useState(false); // Track if auto-upload has occurred

  // Parse query string parameters on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const configs: CropConfigs = {};

    const vmobile = params.get('vmobile');
    const vtablet = params.get('vtablet');
    const vdesksmall = params.get('vdesksmall');

    if (vmobile) {
      const [width, height] = vmobile.split('x').map(Number);
      if (width && height) {
        configs.vmobile = { label: 'Mobile', width, height };
      }
    }

    if (vtablet) {
      const [width, height] = vtablet.split('x').map(Number);
      if (width && height) {
        configs.vtablet = { label: 'Tablet', width, height };
      }
    }

    if (vdesksmall) {
      const [width, height] = vdesksmall.split('x').map(Number);
      if (width && height) {
        configs.vdesksmall = { label: 'Small Desktop', width, height };
      }
    }

    setCropConfigs(configs);
  }, []);

  // Load image through proxy to avoid CORS issues
  useEffect(() => {
    if (!selectedImage?.previewUrl) {
      setProxiedImageUrl('');
      return;
    }

    const loadProxiedImage = async () => {
      setIsLoadingImage(true);
      try {
        const params = new URLSearchParams(window.location.search);
        const organizationId = params.get('organizationId');
        const key = params.get('key');

        if (!organizationId || !key) {
          console.error('Missing URL parameters');
          setProxiedImageUrl(selectedImage.previewUrl || '');
          return;
        }

        const response = await fetch('/api/proxy-image', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            imageUrl: selectedImage.previewUrl,
            organizationId,
            key
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to fetch image through proxy');
        }

        const data = await response.json();
        
        if (!data.success || !data.data) {
          throw new Error(data.error || 'Failed to fetch image');
        }

        // Convert base64 to blob URL
        const base64Data = data.data;
        const contentType = data.contentType || 'image/jpeg';
        const byteCharacters = atob(base64Data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: contentType });
        const blobUrl = URL.createObjectURL(blob);
        
        setProxiedImageUrl(blobUrl);
      } catch (error) {
        console.error('Error loading proxied image:', error);
        // Fallback to original URL
        setProxiedImageUrl(selectedImage.previewUrl || '');
      } finally {
        setIsLoadingImage(false);
      }
    };

    loadProxiedImage();

    // Cleanup blob URL on unmount
    return () => {
      if (proxiedImageUrl && proxiedImageUrl.startsWith('blob:')) {
        URL.revokeObjectURL(proxiedImageUrl);
      }
    };
  }, [selectedImage?.previewUrl]);

  // Load image and get natural dimensions
  useEffect(() => {
    if (!imageRef.current || !selectedImage?.previewUrl) return;

    const img = imageRef.current;
    const handleLoad = () => {
      setImageNaturalDimensions({
        width: img.naturalWidth,
        height: img.naturalHeight
      });
    };

    if (img.complete) {
      handleLoad();
    } else {
      img.addEventListener('load', handleLoad);
      return () => img.removeEventListener('load', handleLoad);
    }
  }, [selectedImage]);

  // Auto-generate crops when image and configs are ready
  useEffect(() => {
    if (proxiedImageUrl && Object.keys(cropConfigs).length > 0 && imageRef.current?.complete) {
      console.log('Auto-generating crops with focal point:', focalPoint);
      generateAllCrops(focalPoint.x, focalPoint.y);
    }
  }, [proxiedImageUrl, cropConfigs]);

  const handleImageClick = (e: React.MouseEvent<HTMLImageElement>) => {
    if (!imageRef.current) return;

    const rect = imageRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;

    setFocalPoint({ x, y });
    generateAllCrops(x, y);
    
    // Reset uploaded versions to allow re-upload with new focal point
    setCroppedVersionPaths({});
    setUploadStatus('');
    setHasAutoUploaded(false); // Reset auto-upload flag to allow manual re-upload
    
    // Notify parent component of focal point change
    if (onFocalPointChange) {
      onFocalPointChange(x, y);
    }
  };

  const generateCropForDevice = (deviceKey: string, focalX: number, focalY: number): string | null => {
    if (!imageRef.current || !canvasRef.current || !cropConfigs[deviceKey]) {
      console.log('generateCropForDevice: Missing dependencies', { 
        deviceKey,
        hasImageRef: !!imageRef.current, 
        hasCanvasRef: !!canvasRef.current,
        hasCropConfig: !!cropConfigs[deviceKey]
      });
      return null;
    }

    const img = imageRef.current;
    const config = cropConfigs[deviceKey];
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      console.log('generateCropForDevice: No canvas context');
      return null;
    }

    // Wait for image to load if not loaded yet
    if (!img.complete || img.naturalWidth === 0) {
      console.log('generateCropForDevice: Image not loaded yet');
      return null;
    }

    // Set canvas to crop dimensions
    canvas.width = config.width;
    canvas.height = config.height;

    // Calculate the crop area centered on the focal point
    const sourceWidth = img.naturalWidth;
    const sourceHeight = img.naturalHeight;

    console.log('generateCropForDevice:', deviceKey, { sourceWidth, sourceHeight, targetWidth: config.width, targetHeight: config.height });

    // Calculate crop rectangle in source image coordinates
    const centerX = focalX * sourceWidth;
    const centerY = focalY * sourceHeight;

    // Calculate aspect ratio
    const targetAspect = config.width / config.height;
    const sourceAspect = sourceWidth / sourceHeight;

    let cropWidth, cropHeight;

    // Determine crop dimensions to fill the target while maintaining aspect ratio
    if (sourceAspect > targetAspect) {
      // Source is wider - crop width
      cropHeight = sourceHeight;
      cropWidth = cropHeight * targetAspect;
    } else {
      // Source is taller - crop height
      cropWidth = sourceWidth;
      cropHeight = cropWidth / targetAspect;
    }

    // Calculate crop position (centered on focal point)
    let cropX = centerX - cropWidth / 2;
    let cropY = centerY - cropHeight / 2;

    // Clamp to image boundaries
    if (cropX < 0) cropX = 0;
    if (cropY < 0) cropY = 0;
    if (cropX + cropWidth > sourceWidth) cropX = sourceWidth - cropWidth;
    if (cropY + cropHeight > sourceHeight) cropY = sourceHeight - cropHeight;

    console.log('generateCropForDevice: Crop area', { cropX, cropY, cropWidth, cropHeight });

    // Clear canvas first
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw the cropped image
    ctx.drawImage(
      img,
      cropX, cropY, cropWidth, cropHeight,
      0, 0, config.width, config.height
    );

    const croppedDataUrl = canvas.toDataURL();
    console.log('generateCropForDevice: Generated data URL for', deviceKey, 'length:', croppedDataUrl.length);
    
    return croppedDataUrl;
  };

  const generateAllCrops = (focalX: number, focalY: number) => {
    if (!imageRef.current || Object.keys(cropConfigs).length === 0) {
      console.log('generateAllCrops: Missing dependencies');
      return;
    }

    // Wait for image to load if not loaded yet
    if (!imageRef.current.complete || imageRef.current.naturalWidth === 0) {
      console.log('generateAllCrops: Image not loaded yet, waiting...');
      imageRef.current.onload = () => {
        console.log('Image loaded, retrying crop generation');
        generateAllCrops(focalX, focalY);
      };
      return;
    }

    const newCroppedImages: { [key: string]: string } = {};
    
    Object.keys(cropConfigs).forEach(deviceKey => {
      const dataUrl = generateCropForDevice(deviceKey, focalX, focalY);
      if (dataUrl) {
        newCroppedImages[deviceKey] = dataUrl;
      }
    });

    setCroppedImages(newCroppedImages);
  };

  const getPresignedUrl = async (itemPath: string): Promise<string> => {
    if (!client) {
      throw new Error('Client not available');
    }

    const appContext = await client.query("application.context");
    const sitecoreContextId = (appContext.data as any).resourceAccess?.[0]?.context?.preview;
    
    if (!sitecoreContextId) {
      throw new Error("Sitecore Context ID not found");
    }
    
    let parsedItemPath = itemPath;
    if (itemPath.toLowerCase().startsWith('/sitecore/media library/')) {
      parsedItemPath = itemPath.substring('/sitecore/media library/'.length);
    }
    
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

    const response: any = await client.mutate("xmc.authoring.graphql", {
      params: {
        query: { sitecoreContextId },
        body: graphqlMutation,
      },
    });

    const presignedUrl = response?.data?.data?.uploadMedia?.presignedUploadUrl;
    if (!presignedUrl) {
      throw new Error("Failed to get presigned URL");
    }

    return presignedUrl;
  };

  const dataUrlToBlob = (dataUrl: string): Blob => {
    const arr = dataUrl.split(',');
    const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/png';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  };

  const uploadToPresignedUrl = async (blob: Blob, presignedUrl: string, fileName: string): Promise<string> => {
    const params = new URLSearchParams(window.location.search);
    const organizationId = params.get('organizationId');
    const key = params.get('key');

    if (!organizationId || !key) {
      throw new Error('Missing URL parameters for authentication');
    }

    const encodedPresignedUrl = encodeURIComponent(presignedUrl);
    const encodedFileType = encodeURIComponent(blob.type);
    const encodedFileName = encodeURIComponent(fileName);
    const encodedOrgId = encodeURIComponent(organizationId);
    const encodedKey = encodeURIComponent(key);
    
    const fileBuffer = await blob.arrayBuffer();

    const response = await fetch(`/api/upload?presignedUrl=${encodedPresignedUrl}&fileType=${encodedFileType}&fileName=${encodedFileName}&organizationId=${encodedOrgId}&key=${encodedKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/octet-stream'
      },
      body: fileBuffer
    });

    const result = await response.json();
    
    if (result.success && result.itemId) {
      return result.itemId;
    } else {
      throw new Error(result.error || 'Upload failed - no item ID returned');
    }
  };

  const uploadCroppedVersions = useCallback(async () => {
    if (!selectedImage?.itemPath || !client || Object.keys(croppedImages).length === 0) {
      console.log('Cannot upload: missing dependencies');
      return;
    }

    setIsUploading(true);
    setUploadStatus('Uploading cropped versions...');
    onProcessingChange?.(true); // Notify parent

    try {
      const newCroppedVersionPaths: { [key: string]: CroppedVersion } = {};
      
      // Get base path without "/sitecore/media library/" prefix
      const baseItemPath = selectedImage.itemPath.replace(/^\/sitecore\/media library\//i, '');
      
      for (const [deviceKey, dataUrl] of Object.entries(croppedImages)) {
        const config = cropConfigs[deviceKey];
        if (!config) continue;

        const dimensions = `${config.width}x${config.height}`;
        setUploadStatus(`Uploading ${config.label} (${dimensions})...`);

        // Create item path with dimensions at the end
        const croppedItemPath = `${selectedImage.itemPath}${dimensions}`;
        
        console.log('Uploading cropped version:', { deviceKey, croppedItemPath });

        // Get presigned URL
        const presignedUrl = await getPresignedUrl(croppedItemPath);

        // Convert data URL to blob
        const blob = dataUrlToBlob(dataUrl);
        
        // Extract file extension from itemPath or use default
        const pathParts = selectedImage.itemPath.split('.');
        const extension = pathParts.length > 1 ? pathParts[pathParts.length - 1] : (selectedImage.imageExtension || 'jpg');
        
        // Create filename with dimensions
        const fileName = `cropped_${dimensions}.${extension}`;

        // Upload to Sitecore
        const itemId = await uploadToPresignedUrl(blob, presignedUrl, fileName);
        
        console.log(`Uploaded ${deviceKey}:`, itemId);

        // Store the path with width and height
        newCroppedVersionPaths[deviceKey] = {
          path: `${baseItemPath}${dimensions}`,
          width: config.width,
          height: config.height
        };
      }

      setCroppedVersionPaths(newCroppedVersionPaths);
      setUploadStatus('All cropped versions uploaded successfully!');

      console.log('All cropped versions uploaded:', newCroppedVersionPaths);

      // Notify parent component
      if (onCroppedVersionsChange) {
        console.log('Calling onCroppedVersionsChange with:', newCroppedVersionPaths);
        onCroppedVersionsChange(newCroppedVersionPaths);
      } else {
        console.warn('onCroppedVersionsChange callback not provided!');
      }
    } catch (error) {
      console.error('Upload error:', error);
      setUploadStatus(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsUploading(false);
      onProcessingChange?.(false); // Notify parent
    }
  }, [selectedImage, client, croppedImages, cropConfigs, onProcessingChange, onCroppedVersionsChange]);

  // Auto-trigger upload when autoCrop is enabled and crops are generated (only once on initial load)
  useEffect(() => {
    if (autoCrop && Object.keys(croppedImages).length > 0 && Object.keys(croppedVersionPaths).length === 0 && !isUploading && client && !hasAutoUploaded) {
      console.log('Auto-triggering crop upload (first time only)');
      setHasAutoUploaded(true); // Mark that auto-upload has occurred
      uploadCroppedVersions();
    }
  }, [autoCrop, croppedImages, croppedVersionPaths, isUploading, client, hasAutoUploaded, uploadCroppedVersions]);

  const hasCropConfigs = Object.keys(cropConfigs).length > 0;

  if (!selectedImage) {
    return (
      <div className="image-cropping-container">
        <div className="no-image-message">
          <p>No image selected. Please upload or find an image first.</p>
        </div>

        <style jsx>{`
          .image-cropping-container {
            padding: 1rem;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
          }

          .no-image-message {
            color: #717171;
            font-size: 0.8125rem;
            padding: 1rem;
          }

          .no-image-message p {
            margin: 0;
          }
        `}</style>
      </div>
    );
  }

  if (!hasCropConfigs) {
    return (
      <div className="image-cropping-container">
        <div className="no-config-message">
          <p>No cropping configurations found in query string.</p>
          <p className="hint">Add vmobile, vtablet, or vdesksmall parameters to enable cropping.</p>
        </div>

        <style jsx>{`
          .image-cropping-container {
            padding: 1rem;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
          }

          .no-config-message {
            color: #717171;
            font-size: 0.8125rem;
            padding: 1rem;
          }

          .no-config-message p {
            margin: 0 0 0.5rem 0;
          }

          .hint {
            font-size: 0.75rem;
            color: #B5B5B5;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="image-cropping-container">
      {/* Instructions */}
      <div className="crop-controls">
        <div className="instructions">
          Click on the image to adjust the focal point for cropping
        </div>
        
        {/* Upload button at the top */}
        {Object.keys(croppedImages).length > 0 && (
          <div className="upload-section-top">
            <button 
              onClick={uploadCroppedVersions}
              disabled={isUploading || Object.keys(croppedVersionPaths).length > 0}
              className="upload-button"
            >
              {isUploading ? 'Uploading...' : Object.keys(croppedVersionPaths).length > 0 ? 'Uploaded ✓' : 'Upload to Sitecore'}
            </button>
            {uploadStatus && (
              <div className={`upload-status ${uploadStatus.includes('failed') ? 'error' : 'success'}`}>
                {uploadStatus}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Original image with focal point indicator */}
      <div className="image-editor">
        <h3>Original Image</h3>
        {isLoadingImage && (
          <div className="loading-message">Loading image...</div>
        )}
        <div className="cropper-wrapper">
          <div className="image-container" style={{ position: 'relative', display: 'inline-block' }}>
            {proxiedImageUrl && (
              <img
                ref={imageRef}
                src={proxiedImageUrl}
                alt={selectedImage.altText || 'Image to crop'}
                onClick={handleImageClick}
                style={{ 
                  maxWidth: '100%', 
                  display: 'block',
                  cursor: 'crosshair'
                }}
              />
            )}
            <div
              className="focal-point"
              style={{
                position: 'absolute',
                left: `${focalPoint.x * 100}%`,
                top: `${focalPoint.y * 100}%`,
                transform: 'translate(-50%, -50%)',
                pointerEvents: 'none'
              }}
            >
              <div className="focal-point-inner"></div>
            </div>
          </div>
          {/* Hidden canvas for image processing */}
          <canvas ref={canvasRef} style={{ display: 'none' }} />
        </div>
      </div>

      {/* Cropped previews */}
      {Object.keys(croppedImages).length > 0 && (
        <div className="cropped-previews">
          <h3>Cropped Images</h3>
          <div className="previews-grid">
            {Object.entries(croppedImages).map(([key, dataUrl]) => {
              const config = cropConfigs[key];
              return (
                <div key={key} className="preview-item">
                  <div className="preview-label">
                    {config.label}
                    <span className="preview-dimensions">{config.width}×{config.height}</span>
                  </div>
                  <div className="preview-image-wrapper">
                    <img src={dataUrl} alt={`${config.label} crop`} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <style jsx>{`
        .image-cropping-container {
          padding: 1rem;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
        }

        .crop-controls {
          margin-bottom: 1.25rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid #E9E9E9;
        }

        .instructions {
          color: #717171;
          font-size: 0.8125rem;
          font-style: italic;
          padding: 0.5rem 0.75rem;
          background-color: #F7F6FF;
          border-radius: 0.375rem;
          border: 1px solid #D9D4FF;
          margin-bottom: 1rem;
        }

        .upload-section-top {
          text-align: center;
          padding: 1rem 0;
        }

        .image-editor {
          margin-bottom: 1.5rem;
        }

        .image-editor h3 {
          margin: 0 0 0.75rem 0;
          font-size: 0.875rem;
          font-weight: 600;
          color: #3B3B3B;
        }

        .loading-message {
          padding: 1rem;
          text-align: center;
          color: #717171;
          font-size: 0.8125rem;
        }

        .cropper-wrapper {
          background-color: #F7F7F7;
          border: 1px solid #E9E9E9;
          border-radius: 0.5rem;
          padding: 0.75rem;
          height: 70vh;
          overflow: auto;
          position: relative;
          display: flex;
          justify-content: center;
          align-items: center;
        }

        .image-container {
          position: relative;
          display: inline-block;
        }

        .focal-point {
          position: absolute;
          width: 40px;
          height: 40px;
          pointer-events: none;
          z-index: 10;
        }

        .focal-point-inner {
          position: relative;
          width: 100%;
          height: 100%;
        }

        .focal-point-inner::before,
        .focal-point-inner::after {
          content: '';
          position: absolute;
          background-color: #6E3FFF;
        }

        .focal-point-inner::before {
          left: 50%;
          top: 0;
          width: 2px;
          height: 100%;
          transform: translateX(-50%);
        }

        .focal-point-inner::after {
          top: 50%;
          left: 0;
          width: 100%;
          height: 2px;
          transform: translateY(-50%);
        }

        .focal-point::before {
          content: '';
          position: absolute;
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%);
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background-color: #6E3FFF;
          border: 2px solid white;
          box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
        }

        .cropped-previews {
          margin-top: 1.5rem;
          padding-top: 1.5rem;
          border-top: 1px solid #E9E9E9;
        }

        .cropped-previews h3 {
          margin: 0 0 1rem 0;
          font-size: 0.875rem;
          font-weight: 600;
          color: #3B3B3B;
        }

        .previews-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
          gap: 1rem;
        }

        .preview-item {
          border: 1px solid #E9E9E9;
          border-radius: 0.375rem;
          overflow: hidden;
          background-color: #FFFFFF;
          box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
          transition: box-shadow 0.2s;
        }

        .preview-item:hover {
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        }

        .preview-label {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.625rem 0.75rem;
          background-color: #F7F7F7;
          border-bottom: 1px solid #E9E9E9;
          font-size: 0.8125rem;
          font-weight: 500;
          color: #3B3B3B;
        }

        .preview-dimensions {
          font-size: 0.6875rem;
          font-weight: 400;
          color: #717171;
        }

        .preview-image-wrapper {
          padding: 0.75rem;
          background-color: #F7F7F7;
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 150px;
        }

        .preview-image-wrapper img {
          max-width: 100%;
          height: auto;
          display: block;
          border: 1px solid #E9E9E9;
          border-radius: 0.25rem;
        }

        .upload-button {
          padding: 0.625rem 1.25rem;
          background-color: #6E3FFF;
          color: white;
          border: none;
          border-radius: 9999px;
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
        }

        .upload-button:hover:not(:disabled) {
          background-color: #5319E0;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
          transform: translateY(-1px);
        }

        .upload-button:active:not(:disabled) {
          transform: translateY(0);
          box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
        }

        .upload-button:disabled {
          background-color: #E9E9E9;
          color: #B5B5B5;
          cursor: not-allowed;
          box-shadow: none;
        }

        .upload-status {
          margin-top: 0.75rem;
          padding: 0.5rem 0.75rem;
          border-radius: 0.375rem;
          font-size: 0.8125rem;
        }

        .upload-status.success {
          background-color: #E8FCF5;
          color: #007F66;
          border: 1px solid #8BEBD0;
        }

        .upload-status.error {
          background-color: #FFF5F4;
          color: #D92739;
          border: 1px solid #FFE4E2;
        }
      `}</style>
    </div>
  );
}
