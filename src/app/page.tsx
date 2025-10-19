"use client";

import { useState, useEffect } from 'react';
import { useMarketplaceClient } from '@/src/utils/hooks/useMarketplaceClient';
import { getConfig } from '@/src/lib/config';
import { getFolder, createFolder } from '@/src/lib/folder-manager';
import { ImageSelector } from '@/src/components/ImageSelector';
import { ImageFind } from '@/src/components/ImageFind';
import { ImageMetadata } from '@/src/components/ImageMetadata';
import { AppContext } from '@/src/components/AppContext';
import { ClientSDK } from '@sitecore-marketplace-sdk/client';
import { upsertImageMetadata, getUrlParams } from '@/src/lib/supabase-client';

type ActiveView = 'new' | 'find' | 'metadata' | 'appcontext';

interface SelectedImage {
  path: string;
  itemPath: string;
  itemId: string;
  imageUrl?: string;
  altText?: string;
  description?: string;
  imageName?: string;
  imageExtension?: string;
  width?: number;
  height?: number;
  sizeKb?: number;
  aspectRatio?: string;
}

function CustomFieldExtension() {
  const { client, isInitialized, error } = useMarketplaceClient();
  const [isCheckingEnvironment, setIsCheckingEnvironment] = useState(true);
  const [environmentReady, setEnvironmentReady] = useState(false);
  const [environmentError, setEnvironmentError] = useState<string>('');
  const [activeView, setActiveView] = useState<ActiveView>('new');
  const [selectedImage, setSelectedImage] = useState<SelectedImage | null>(null);
  const [initialImage, setInitialImage] = useState<SelectedImage | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  // Load existing field value when component opens
  useEffect(() => {
    const loadExistingValue = async () => {
      if (!isInitialized || !client || error) {
        return;
      }

      try {
        const existingValue = await client.getValue();
        if (existingValue) {
          const parsedValue: SelectedImage = JSON.parse(existingValue);
          
          // Construct the image URL from itemPath
          if (parsedValue.itemPath) {
            const params = getUrlParams();
            if (!params) {
              console.error('Missing URL parameters');
              return;
            }
            
            const config = await getConfig(params.organizationId, params.key);
            // Replace "/sitecore/media library/" with config.previewHost + "/-/jssmedia/"
            const imageUrl = parsedValue.itemPath
              .replace(/^\/sitecore\/media library\//i, config.previewHost + '/-/jssmedia/');
            
            parsedValue.imageUrl = imageUrl;
            
            // Extract name and extension if not already present
            if (!parsedValue.imageName || !parsedValue.imageExtension) {
              const pathParts = parsedValue.itemPath.split('/');
              const fileName = pathParts[pathParts.length - 1] || '';
              const lastDotIndex = fileName.lastIndexOf('.');
              
              if (lastDotIndex !== -1) {
                parsedValue.imageName = fileName.substring(0, lastDotIndex);
                parsedValue.imageExtension = fileName.substring(lastDotIndex + 1).toLowerCase();
              } else {
                parsedValue.imageName = fileName;
                parsedValue.imageExtension = '';
              }
            }
            
            setSelectedImage(parsedValue);
            setInitialImage(parsedValue); // Store initial state for comparison
            
            // Default to metadata tab when there's an existing image
            setActiveView('metadata');
          }
        }
      } catch (error) {
        console.error('Error loading existing value:', error);
      }
    };

    loadExistingValue();
  }, [client, isInitialized, error]);

  // Track changes by comparing current state with initial state
  useEffect(() => {
    if (!selectedImage) {
      setHasChanges(false);
      return;
    }

    // If there's no initial image, it means a new image was just uploaded
    if (!initialImage) {
      setHasChanges(true);
      return;
    }

    // Compare all fields
    const changed = 
      selectedImage.itemId !== initialImage.itemId ||
      selectedImage.itemPath !== initialImage.itemPath ||
      selectedImage.altText !== initialImage.altText ||
      selectedImage.description !== initialImage.description ||
      selectedImage.imageName !== initialImage.imageName ||
      selectedImage.imageExtension !== initialImage.imageExtension;

    setHasChanges(changed);
  }, [selectedImage, initialImage]);

  useEffect(() => {
    const checkEnvironment = async () => {
      if (!isInitialized || !client || error) {
        return;
      }

      try {
        setIsCheckingEnvironment(true);
        
        // Get URL params
        const params = getUrlParams();
        if (!params) {
          setEnvironmentError('Missing URL parameters (organizationId and key)');
          setIsCheckingEnvironment(false);
          return;
        }
        
        console.log('Loading library config for:', params);
        
        // Get the base folder from config
        const config = await getConfig(params.organizationId, params.key);
        console.log('Loaded config:', config);
        
        const baseFolder = config.baseFolder;
        
        // Check if the base folder exists
        console.log('Checking if base folder exists:', baseFolder);
        let folderId = await getFolder(client, baseFolder);
        console.log('Folder check result:', folderId ? 'exists' : 'not found');
        
        if (!folderId) {
          // Base folder doesn't exist, create it
          console.log('Creating base folder structure:', baseFolder);
          folderId = await createFolder(client, baseFolder);
          
          if (folderId) {
            console.log('✅ Base folder created successfully:', folderId);
            setEnvironmentReady(true);
          } else {
            console.error('❌ Failed to create base folder');
            setEnvironmentReady(false);
            setEnvironmentError(`Failed to create base folder in Sitecore: ${baseFolder}`);
          }
        } else {
          // Environment is ready
          console.log('✅ Base folder exists');
          setEnvironmentReady(true);
        }
      } catch (error) {
        console.error('Error checking environment:', error);
        setEnvironmentError(error instanceof Error ? error.message : 'Unknown error');
      } finally {
        setIsCheckingEnvironment(false);
      }
    };

    checkEnvironment();
  }, [client, isInitialized, error]);

  const handleSave = async () => {
    if (!client || !selectedImage || !hasChanges) {
      alert('No changes to save');
      return;
    }

    try {
      console.log('Save is clicked, data to save:', selectedImage);
      
      // Save to Sitecore
      const dataToSave = JSON.stringify(selectedImage);
      await client.setValue(dataToSave, true);
      console.log('✅ Saved to Sitecore');
      
      // Save to Supabase for search functionality
      const params = getUrlParams();
      if (params && selectedImage.imageUrl) {
        console.log('Saving to Supabase with params:', params);
        const result = await upsertImageMetadata({
          organization_id: params.organizationId,
          key: params.key,
          image_item_path: selectedImage.itemPath,
          image_item_id: selectedImage.itemId,
          image_preview_path: selectedImage.imageUrl,
          alt_text: selectedImage.altText,
          description: selectedImage.description,
          image_name: selectedImage.imageName,
          image_extension: selectedImage.imageExtension,
          width: selectedImage.width,
          height: selectedImage.height,
          size_kb: selectedImage.sizeKb,
          aspect_ratio: selectedImage.aspectRatio
        });
        
        if (result.success) {
          console.log('✅ Saved to Supabase with ID:', result.id);
        } else {
          console.error('Failed to save to Supabase:', result.error);
        }
      } else {
        console.warn('Skipping Supabase save - missing URL params or imageUrl');
      }
      
      // Update initial image to current state after successful save
      setInitialImage(selectedImage);
      setHasChanges(false);
      
      client.closeApp();
    } catch (error) {
      console.error('Save error:', error);
      alert(`Failed to save: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleImageSelected = (imageData: SelectedImage) => {
    setSelectedImage(imageData);
  };

  const handleMetadataChange = (altText: string, description: string) => {
    if (selectedImage) {
      setSelectedImage({
        ...selectedImage,
        altText,
        description
      });
    }
  };

  // Show loading state while initializing client
  if (!isInitialized) {
    return (
      <div className="loading-container">
        <div>Initializing Sitecore client...</div>
      </div>
    );
  }

  // Show error if client failed to initialize
  if (error) {
    return (
      <div className="error-container">
        <div>Client Error: {String(error)}</div>
      </div>
    );
  }

  // Show loading state while checking environment
  if (isCheckingEnvironment) {
    return (
      <div className="loading-container">
        <div>Checking environment...</div>
      </div>
    );
  }

  // Show error if environment check failed or not ready
  if (environmentError || (!environmentReady && client && !isCheckingEnvironment)) {
    return (
      <div className="error-container">
        <div>
          {environmentError || 'Environment setup required. Please check your library configuration.'}
        </div>
        <div style={{ fontSize: '12px', marginTop: '10px', color: '#666' }}>
          Check the browser console for more details.
        </div>
      </div>
    );
  }

  // Show main interface if environment is ready
  if (client) {
    return (
      <div className="app-container">
        {/* Top Toolbar */}
        <div className="toolbar">
          {/* Left side - Navigation */}
          <div className="toolbar-left">
            <button 
              className={`tab-button ${activeView === 'new' ? 'active' : ''}`}
              onClick={() => setActiveView('new')}
            >
              New
            </button>
            <span className="separator">|</span>
            <button 
              className={`tab-button ${activeView === 'find' ? 'active' : ''}`}
              onClick={() => setActiveView('find')}
            >
              Find
            </button>
            <span className="separator">|</span>
            <button 
              className={`tab-button ${activeView === 'metadata' ? 'active' : ''}`}
              onClick={() => setActiveView('metadata')}
            >
              Metadata
            </button>
            <span className="separator">|</span>
            <button 
              className={`tab-button ${activeView === 'appcontext' ? 'active' : ''}`}
              onClick={() => setActiveView('appcontext')}
            >
              AppContext
            </button>
          </div>

          {/* Right side - Thumbnail and Save */}
          <div className="toolbar-right">
            {selectedImage?.imageUrl && (
              <div className="thumbnail-preview">
                <img src={selectedImage.imageUrl} alt="Selected" />
              </div>
            )}
            <button 
              className="save-button"
              onClick={handleSave}
              disabled={!hasChanges}
            >
              Save
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="content-area">
          {activeView === 'new' && <ImageSelector client={client} onImageSelected={handleImageSelected} />}
          {activeView === 'find' && <ImageFind client={client} onImageSelected={handleImageSelected} />}
          {activeView === 'metadata' && (
            <ImageMetadata 
              client={client} 
              selectedImage={selectedImage}
              onMetadataChange={handleMetadataChange}
            />
          )}
          {activeView === 'appcontext' && <AppContext />}
        </div>

        {/* Hidden field to store selected image data */}
        <input 
          type="hidden" 
          value={selectedImage ? JSON.stringify(selectedImage) : ''} 
          readOnly 
        />
      
        <style jsx>{`
          .app-container {
            min-height: 100vh;
            background-color: #ffffff;
            display: flex;
            flex-direction: column;
          }

          .toolbar {
            display: flex;
            justify-content: space-between;
            align-items: center;
            background-color: #fafafa;
            border-bottom: 1px solid #e5e5e5;
            padding: 8px 16px;
          }

          .toolbar-left {
            display: flex;
            align-items: center;
            gap: 4px;
          }

          .tab-button {
            background: none;
            border: none;
            color: #666;
            font-size: 13px;
            font-weight: 400;
            padding: 6px 10px;
            cursor: pointer;
            transition: color 0.2s;
            border-radius: 2px;
          }

          .tab-button:hover {
            color: #333;
          }

          .tab-button.active {
            color: #1e90ff;
          }

          .separator {
            color: #d0d0d0;
            font-size: 13px;
            user-select: none;
            margin: 0 4px;
          }

          .toolbar-right {
            display: flex;
            align-items: center;
            gap: 10px;
          }

          .thumbnail-preview {
            width: 32px;
            height: 32px;
            border-radius: 2px;
            overflow: hidden;
            border: 1px solid #e0e0e0;
            background-color: #fafafa;
          }

          .thumbnail-preview img {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }

          .save-button {
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
          }

          .save-button:hover:not(:disabled) {
            background: linear-gradient(135deg, #6D28D9 0%, #4F46E5 100%);
            box-shadow: 0 4px 12px rgba(124, 58, 237, 0.4);
            transform: translateY(-1px);
          }

          .save-button:disabled {
            background: #e0e0e0;
            color: #999;
            cursor: not-allowed;
            box-shadow: none;
            transform: none;
          }

          .content-area {
            flex: 1;
            overflow-y: auto;
            background-color: #ffffff;
          }
          
          .loading-container {
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 200px;
            color: #666;
            font-size: 14px;
          }
          
          .error-container {
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 200px;
            color: #d32f2f;
            font-size: 14px;
            padding: 20px;
            text-align: center;
          }
        `}</style>
      </div>
    );
  }

  // Fallback - should not reach here
  return (
    <div className="error-container">
      <div>Unable to initialize the application</div>
    </div>
  );
}

export default CustomFieldExtension;
