// components/ImageMetadata.tsx

"use client";

import { useState, useEffect } from 'react';
import { ClientSDK } from '@sitecore-marketplace-sdk/client';

interface SelectedImage {
  path: string;
  itemPath: string;
  itemId: string;
  imageUrl?: string;
  altText?: string;
  description?: string;
}

interface ImageMetadataProps {
  client: ClientSDK;
  selectedImage: SelectedImage | null;
  onMetadataChange: (altText: string, description: string) => void;
}

export function ImageMetadata({ client, selectedImage, onMetadataChange }: ImageMetadataProps) {
  const [altText, setAltText] = useState('');
  const [description, setDescription] = useState('');

  // Load metadata when selectedImage changes
  useEffect(() => {
    if (selectedImage) {
      setAltText(selectedImage.altText || '');
      setDescription(selectedImage.description || '');
    }
  }, [selectedImage]);

  const handleAltTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setAltText(value);
    onMetadataChange(value, description);
  };

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setDescription(value);
    onMetadataChange(altText, value);
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
      {selectedImage.imageUrl && (
        <div className="image-preview">
          <img src={selectedImage.imageUrl} alt={altText || 'Selected image'} />
        </div>
      )}

      <div className="metadata-form">
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

        <div className="image-info">
          <div className="info-item">
            <span className="info-label">Image path</span>
            <span className="info-value">{selectedImage.itemPath}</span>
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
      `}</style>
    </div>
  );
}
