"use client";

import { useState, useEffect } from 'react';
import { useMarketplaceClient } from '@/src/utils/hooks/useMarketplaceClient';
import { getConfig } from '@/src/lib/config';
import { getFolder } from '@/src/lib/folder-manager';
import { Welcome } from '@/src/components/Welcome';
import { ImageSelector } from '@/src/components/ImageSelector';
import { ClientSDK } from '@sitecore-marketplace-sdk/client';

function CustomFieldExtension() {
  const { client, isInitialized, error } = useMarketplaceClient();
  const [isCheckingEnvironment, setIsCheckingEnvironment] = useState(true);
  const [environmentReady, setEnvironmentReady] = useState(false);
  const [environmentError, setEnvironmentError] = useState<string>('');

  useEffect(() => {
    const checkEnvironment = async () => {
      if (!isInitialized || !client || error) {
        return;
      }

      try {
        setIsCheckingEnvironment(true);
        
        // Get the base folder from config
        const config = getConfig(''); // Pass empty string for organization ID as it's hardcoded
        const baseFolder = config.baseFolder;
        
        // Check if the base folder exists
        const folderId = await getFolder(client, baseFolder);
        
        if (folderId) {
          // Environment is ready
          setEnvironmentReady(true);
        } else {
          // Environment needs setup
          setEnvironmentReady(false);
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

  const handleSetupComplete = () => {
    setEnvironmentReady(true);
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

  // Show error if environment check failed
  if (environmentError) {
    return (
      <div className="error-container">
        <div>Environment Error: {environmentError}</div>
      </div>
    );
  }

  // Show welcome/setup if environment is not ready
  if (!environmentReady && client) {
    const config = getConfig('');
    return (
      <Welcome 
        onSetupComplete={handleSetupComplete}
        client={client}
        baseFolder={config.baseFolder}
      />
    );
  }

  // Show image selector if environment is ready
  if (client) {
    return (
      <div className="app-container">
        <ImageSelector client={client} />
      
        <style jsx>{`
          .app-container {
            min-height: 100vh;
            background-color: #f5f5f5;
            padding: 20px;
          }
          
          .loading-container {
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 200px;
            color: #666;
            font-size: 16px;
          }
          
          .error-container {
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 200px;
            color: #d32f2f;
            font-size: 16px;
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
