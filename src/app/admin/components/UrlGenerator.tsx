"use client";

import { useState, useEffect } from 'react';
import { Library } from '../types/library';

interface UrlGeneratorProps {
  library: Library;
  onBack: () => void;
}

interface ViewportDimensions {
  width: string;
  height: string;
}

interface Viewports {
  mobile: ViewportDimensions | null;
  tablet: ViewportDimensions | null;
  small: ViewportDimensions | null;
}

export function UrlGenerator({ library, onBack }: UrlGeneratorProps) {
  const [autoPublish, setAutoPublish] = useState(true); // Default to enabled
  const [originalWidth, setOriginalWidth] = useState('');
  const [originalHeight, setOriginalHeight] = useState('');
  const [originalSizeKb, setOriginalSizeKb] = useState('');
  const [viewports, setViewports] = useState<Viewports>({
    mobile: null,
    tablet: null,
    small: null,
  });
  const fieldUrlHost = process.env.NEXT_PUBLIC_FIELD_URL_HOST || 'http://localhost:3000';

  const generateUrl = (): string => {
    const params = new URLSearchParams();
    params.set('key', library.key);

    // Auto Publish
    params.set('ap', autoPublish ? '1' : '0');

    // Original Image Dimensions
    if (originalWidth && originalHeight) {
      params.set('oridim', `${originalWidth}x${originalHeight}`);
    }

    // Original Image Size
    if (originalSizeKb) {
      params.set('orisizekb', originalSizeKb);
    }

    // Viewports
    if (viewports.mobile && viewports.mobile.width && viewports.mobile.height) {
      params.set('vmobile', `${viewports.mobile.width}x${viewports.mobile.height}`);
    }

    if (viewports.tablet && viewports.tablet.width && viewports.tablet.height) {
      params.set('vtablet', `${viewports.tablet.width}x${viewports.tablet.height}`);
    }

    if (viewports.small && viewports.small.width && viewports.small.height) {
      params.set('vdesksmall', `${viewports.small.width}x${viewports.small.height}`);
    }

    return `${fieldUrlHost}?${params.toString()}`;
  };

  const generatedUrl = generateUrl();

  const toggleViewport = (viewport: keyof Viewports) => {
    setViewports((prev) => ({
      ...prev,
      [viewport]: prev[viewport] ? null : { width: '', height: '' },
    }));
  };

  const updateViewportDimension = (
    viewport: keyof Viewports,
    dimension: 'width' | 'height',
    value: string
  ) => {
    setViewports((prev) => ({
      ...prev,
      [viewport]: {
        ...(prev[viewport] || { width: '', height: '' }),
        [dimension]: value,
      },
    }));
  };

  return (
    <div className="url-generator">
      <div className="header">
        <button className="btn-back" onClick={onBack} title="Back to library list">
          ← Back
        </button>
        <h2>Generate Field URL</h2>
        <div className="library-info">
          <strong>{library.name}</strong>
          <span className="key-badge">{library.key}</span>
        </div>
      </div>

      <div className="form-container">
        <div className="form-section">
          <h3>Configuration Options</h3>

          {/* Auto Publish */}
          <div className="form-group checkbox-group">
            <label>
              <input
                type="checkbox"
                checked={autoPublish}
                onChange={(e) => setAutoPublish(e.target.checked)}
              />
              <span className="checkbox-label">Auto Publish</span>
            </label>
            <small className="help-text">
              Automatically publish images after uploading or processing. Recommended to enable.
            </small>
          </div>
        </div>

        {/* Original Image Recommendations */}
        <div className="form-section">
          <h3>Original Image Recommendations</h3>

          <div className="form-row">
            <div className="form-group">
              <label>Original Image Dimensions</label>
              <div className="dimension-inputs">
                <input
                  type="number"
                  placeholder="Width"
                  value={originalWidth}
                  onChange={(e) => setOriginalWidth(e.target.value)}
                  min="1"
                />
                <span className="separator">×</span>
                <input
                  type="number"
                  placeholder="Height"
                  value={originalHeight}
                  onChange={(e) => setOriginalHeight(e.target.value)}
                  min="1"
                />
              </div>
              <small className="help-text">Example: 1200 × 800</small>
            </div>

            <div className="form-group">
              <label>Original Image Size (KB)</label>
              <input
                type="number"
                placeholder="500"
                value={originalSizeKb}
                onChange={(e) => setOriginalSizeKb(e.target.value)}
                min="1"
              />
              <small className="help-text">Maximum file size in kilobytes</small>
            </div>
          </div>
        </div>

        {/* Viewport Options */}
        <div className="form-section">
          <h3>Viewport-Specific Dimensions</h3>
          <p className="section-description">
            Select viewports and specify image dimensions for each
          </p>

          {/* Mobile */}
          <div className="viewport-option">
            <label className="viewport-header">
              <input
                type="checkbox"
                checked={viewports.mobile !== null}
                onChange={() => toggleViewport('mobile')}
              />
              <span className="viewport-label">📱 Mobile</span>
            </label>
            {viewports.mobile && (
              <div className="dimension-inputs">
                <input
                  type="number"
                  placeholder="Width"
                  value={viewports.mobile.width}
                  onChange={(e) => updateViewportDimension('mobile', 'width', e.target.value)}
                  min="1"
                />
                <span className="separator">×</span>
                <input
                  type="number"
                  placeholder="Height"
                  value={viewports.mobile.height}
                  onChange={(e) => updateViewportDimension('mobile', 'height', e.target.value)}
                  min="1"
                />
              </div>
            )}
          </div>

          {/* Tablet Portrait */}
          <div className="viewport-option">
            <label className="viewport-header">
              <input
                type="checkbox"
                checked={viewports.tablet !== null}
                onChange={() => toggleViewport('tablet')}
              />
              <span className="viewport-label">📱 Tablet Portrait</span>
            </label>
            {viewports.tablet && (
              <div className="dimension-inputs">
                <input
                  type="number"
                  placeholder="Width"
                  value={viewports.tablet.width}
                  onChange={(e) => updateViewportDimension('tablet', 'width', e.target.value)}
                  min="1"
                />
                <span className="separator">×</span>
                <input
                  type="number"
                  placeholder="Height"
                  value={viewports.tablet.height}
                  onChange={(e) => updateViewportDimension('tablet', 'height', e.target.value)}
                  min="1"
                />
              </div>
            )}
          </div>

          {/* Desktop Small */}
          <div className="viewport-option">
            <label className="viewport-header">
              <input
                type="checkbox"
                checked={viewports.small !== null}
                onChange={() => toggleViewport('small')}
              />
              <span className="viewport-label">💻 Desktop Small</span>
            </label>
            {viewports.small && (
              <div className="dimension-inputs">
                <input
                  type="number"
                  placeholder="Width"
                  value={viewports.small.width}
                  onChange={(e) => updateViewportDimension('small', 'width', e.target.value)}
                  min="1"
                />
                <span className="separator">×</span>
                <input
                  type="number"
                  placeholder="Height"
                  value={viewports.small.height}
                  onChange={(e) => updateViewportDimension('small', 'height', e.target.value)}
                  min="1"
                />
              </div>
            )}
          </div>
        </div>

        {/* Generated URL */}
        <div className="form-section url-section">
          <h3>Generated Field URL</h3>
          <div className="url-display">
            <input
              type="text"
              className="url-input"
              value={generatedUrl}
              readOnly
              onClick={(e) => e.currentTarget.select()}
            />
          </div>
          <div className="info-box">
            <strong>💡 How to use this URL:</strong>
            <p>
              Use this URL when creating your Marketplace Custom Field in Sitecore. 
              This URL will load the Smart Image Field with the configuration options you specified above.
            </p>
          </div>
        </div>
      </div>

      <style jsx>{`
        .url-generator {
          padding: 24px;
          max-width: 900px;
          margin: 0 auto;
        }

        .header {
          margin-bottom: 32px;
        }

        .btn-back {
          background: none;
          border: 1px solid #d0d0d0;
          padding: 8px 16px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
          color: #666;
          margin-bottom: 16px;
          transition: all 0.2s;
        }

        .btn-back:hover {
          background-color: #f5f5f5;
          border-color: #999;
        }

        h2 {
          font-size: 24px;
          font-weight: 600;
          color: #333;
          margin: 0 0 12px 0;
        }

        .library-info {
          display: flex;
          align-items: center;
          gap: 12px;
          color: #666;
          font-size: 14px;
        }

        .key-badge {
          background: #f0f0f0;
          padding: 4px 8px;
          border-radius: 4px;
          font-family: monospace;
          font-size: 12px;
        }

        .form-container {
          background: white;
          border: 1px solid #e5e5e5;
          border-radius: 8px;
          overflow: hidden;
        }

        .form-section {
          padding: 24px;
          border-bottom: 1px solid #e5e5e5;
        }

        .form-section:last-child {
          border-bottom: none;
        }

        h3 {
          font-size: 16px;
          font-weight: 600;
          color: #333;
          margin: 0 0 16px 0;
        }

        .section-description {
          color: #666;
          font-size: 14px;
          margin: -8px 0 16px 0;
        }

        .form-group {
          margin-bottom: 20px;
        }

        .form-group:last-child {
          margin-bottom: 0;
        }

        .form-group label {
          display: block;
          font-size: 14px;
          font-weight: 500;
          color: #333;
          margin-bottom: 8px;
        }

        .checkbox-group label {
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
        }

        .checkbox-label {
          font-size: 14px;
          font-weight: 500;
          color: #333;
        }

        input[type="checkbox"] {
          width: 18px;
          height: 18px;
          cursor: pointer;
        }

        input[type="number"],
        input[type="text"] {
          width: 100%;
          padding: 8px 12px;
          border: 1px solid #d0d0d0;
          border-radius: 4px;
          font-size: 14px;
          font-family: inherit;
        }

        input[type="number"]:focus,
        input[type="text"]:focus {
          outline: none;
          border-color: #7C3AED;
          box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.1);
        }

        .help-text {
          display: block;
          font-size: 12px;
          color: #999;
          margin-top: 4px;
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }

        .dimension-inputs {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .dimension-inputs input {
          flex: 1;
        }

        .separator {
          color: #999;
          font-size: 18px;
          font-weight: 300;
        }

        .viewport-option {
          margin-bottom: 16px;
          padding: 16px;
          background: #f9f9f9;
          border-radius: 6px;
        }

        .viewport-option:last-child {
          margin-bottom: 0;
        }

        .viewport-header {
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          margin-bottom: 12px;
        }

        .viewport-label {
          font-size: 14px;
          font-weight: 500;
          color: #333;
        }

        .url-section {
          background: #f5f3ff;
        }

        .url-display {
          margin-bottom: 16px;
        }

        .url-input {
          width: 100%;
          font-family: monospace;
          font-size: 13px;
          background: white;
        }

        .info-box {
          background: white;
          border: 1px solid #e0d4ff;
          border-radius: 6px;
          padding: 16px;
        }

        .info-box strong {
          display: block;
          color: #7C3AED;
          margin-bottom: 8px;
          font-size: 14px;
        }

        .info-box p {
          margin: 0;
          color: #666;
          font-size: 13px;
          line-height: 1.6;
        }

        @media (max-width: 768px) {
          .form-row {
            grid-template-columns: 1fr;
          }

          .url-display {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
}

