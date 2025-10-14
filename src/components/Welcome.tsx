// components/Welcome.tsx

"use client";

import { ClientSDK } from '@sitecore-marketplace-sdk/client';
import { useState, useEffect } from 'react';


interface WelcomeProps {
  onSetupComplete: () => void;
  client: ClientSDK;
  baseFolder: string;
}

export function Welcome({ onSetupComplete, client, baseFolder }: WelcomeProps) {
  const [isSettingUp, setIsSettingUp] = useState(false);
  const [setupStatus, setSetupStatus] = useState<string>('');

  const startSetup = async () => {
    setIsSettingUp(true);
    setSetupStatus('Setting up environment...');
    
    try {
      // Forced delay to give impression of slower process
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      setSetupStatus('Creating base folder structure...');
      
      // Import the createFolder function dynamically
      const { createFolder } = await import('@/src/lib/folder-manager');
      const folderId = await createFolder(client, baseFolder);
      
      if (folderId) {
        setSetupStatus('Environment setup completed successfully!');
        setTimeout(() => {
          onSetupComplete();
        }, 1000);
      } else {
        throw new Error('Failed to create base folder');
      }
    } catch (error) {
      console.error('Setup error:', error);
      setSetupStatus(`Setup failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setIsSettingUp(false);
    }
  };

  useEffect(() => {
    // Auto-start setup when component mounts
    startSetup();
  }, []);

  return (
    <div className="welcome-container">
      <div className="welcome-card">
        <h2>Smart Image Field Setup</h2>
        <p>Welcome! We're setting up the environment for your Smart Image Field.</p>
        
        <div className="status-section">
          <div className="status-text">{setupStatus}</div>
          {isSettingUp && (
            <div className="loading-spinner">
              <div className="spinner"></div>
            </div>
          )}
        </div>
        
        {!isSettingUp && setupStatus.includes('failed') && (
          <button onClick={startSetup} className="retry-button">
            Retry Setup
          </button>
        )}
      </div>
      
      <style jsx>{`
        .welcome-container {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 400px;
          padding: 20px;
        }
        
        .welcome-card {
          background: white;
          border-radius: 12px;
          padding: 40px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
          text-align: center;
          max-width: 500px;
          width: 100%;
        }
        
        .welcome-card h2 {
          color: #333;
          margin-bottom: 16px;
          font-size: 24px;
        }
        
        .welcome-card p {
          color: #666;
          margin-bottom: 30px;
          font-size: 16px;
          line-height: 1.5;
        }
        
        .status-section {
          margin: 30px 0;
        }
        
        .status-text {
          color: #555;
          font-size: 16px;
          margin-bottom: 20px;
          min-height: 24px;
        }
        
        .loading-spinner {
          display: flex;
          justify-content: center;
          align-items: center;
        }
        
        .spinner {
          width: 32px;
          height: 32px;
          border: 3px solid #f3f3f3;
          border-top: 3px solid #007acc;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        .retry-button {
          background-color: #007acc;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 16px;
          transition: background-color 0.2s;
        }
        
        .retry-button:hover {
          background-color: #005a9f;
        }
      `}</style>
    </div>
  );
}