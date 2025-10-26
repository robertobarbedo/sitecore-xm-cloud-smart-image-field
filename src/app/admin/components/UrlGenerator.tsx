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
  const [autoCaption, setAutoCaption] = useState(true); // Default to enabled
  const [autoCropping, setAutoCropping] = useState(true); // Default to enabled
  const [originalWidth, setOriginalWidth] = useState('');
  const [originalHeight, setOriginalHeight] = useState('');
  const [originalSizeKb, setOriginalSizeKb] = useState('');
  const [originalAspectRatio, setOriginalAspectRatio] = useState('');
  const [viewports, setViewports] = useState<Viewports>({
    mobile: null,
    tablet: null,
    small: null,
  });
  const fieldUrlHost = process.env.NEXT_PUBLIC_FIELD_URL_HOST || 'http://localhost:3000';

  const commonAspectRatios = [
    { value: '', label: 'No recommendation' },
    { value: '1:1', label: '1:1 (Square)' },
    { value: '4:3', label: '4:3 (Standard)' },
    { value: '3:2', label: '3:2 (Classic)' },
    { value: '16:9', label: '16:9 (Widescreen)' },
    { value: '21:9', label: '21:9 (Ultrawide)' },
    { value: '9:16', label: '9:16 (Portrait)' },
    { value: '2:3', label: '2:3 (Portrait)' },
    { value: '3:4', label: '3:4 (Portrait)' },
  ];

  const generateUrl = (): string => {
    const params = new URLSearchParams();
    params.set('key', library.key);

    // Auto Publish
    params.set('ap', autoPublish ? '1' : '0');

    // Auto Caption
    if (autoCaption) {
      params.set('acapt', '1');
    }

    // Auto Cropping
    if (autoCropping) {
      params.set('acrop', '1');
    }

    // Original Image Dimensions
    if (originalWidth && originalHeight) {
      params.set('oridim', `${originalWidth}x${originalHeight}`);
    }

    // Original Image Size
    if (originalSizeKb) {
      params.set('orisizekb', originalSizeKb);
    }

    // Original Aspect Ratio
    if (originalAspectRatio) {
      params.set('oriaspect', originalAspectRatio.replace(':', 'per'));
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
          <h3>New Image Flow</h3>
          <p className="section-description">
            Configure automation options for newly uploaded images
          </p>

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

          {/* Auto Caption */}
          <div className="form-group checkbox-group">
            <label>
              <input
                type="checkbox"
                checked={autoCaption}
                onChange={(e) => setAutoCaption(e.target.checked)}
              />
              <span className="checkbox-label">Auto Caption</span>
            </label>
            <small className="help-text">
              Automatically generate alt text and description using AI when uploading new images.
            </small>
          </div>

          {/* Auto Cropping */}
          <div className="form-group checkbox-group">
            <label>
              <input
                type="checkbox"
                checked={autoCropping}
                onChange={(e) => setAutoCropping(e.target.checked)}
              />
              <span className="checkbox-label">Auto Cropping</span>
            </label>
            <small className="help-text">
              Automatically generate cropped versions for configured viewports when uploading new images.
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

          <div className="form-group">
            <label>Original Aspect Ratio</label>
            <select
              value={originalAspectRatio}
              onChange={(e) => setOriginalAspectRatio(e.target.value)}
              className="aspect-ratio-select"
            >
              {commonAspectRatios.map((ratio) => (
                <option key={ratio.value} value={ratio.value}>
                  {ratio.label}
                </option>
              ))}
            </select>
            <small className="help-text">Recommended aspect ratio for the image</small>
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
          padding: 1.5rem;
          max-width: 900px;
          margin: 0 auto;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
        }

        .header {
          margin-bottom: 2rem;
        }

        .btn-back {
          background: none;
          border: 1px solid #D8D8D8;
          padding: 0.5rem 1rem;
          border-radius: 0.375rem;
          cursor: pointer;
          font-size: 0.875rem;
          color: #717171;
          margin-bottom: 1rem;
          transition: all 0.2s;
        }

        .btn-back:hover {
          background-color: #F7F7F7;
          border-color: #B5B5B5;
          color: #3B3B3B;
        }

        h2 {
          font-size: 1.5rem;
          font-weight: 600;
          color: #3B3B3B;
          margin: 0 0 0.75rem 0;
        }

        .library-info {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          color: #717171;
          font-size: 0.875rem;
        }

        .key-badge {
          background: #F7F7F7;
          padding: 0.25rem 0.5rem;
          border-radius: 0.25rem;
          font-family: monospace;
          font-size: 0.75rem;
        }

        .form-container {
          background: white;
          border: 1px solid #E9E9E9;
          border-radius: 0.5rem;
          overflow: hidden;
          box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
        }

        .form-section {
          padding: 1.5rem;
          border-bottom: 1px solid #E9E9E9;
        }

        .form-section:last-child {
          border-bottom: none;
        }

        h3 {
          font-size: 1rem;
          font-weight: 600;
          color: #3B3B3B;
          margin: 0 0 1rem 0;
        }

        .section-description {
          color: #717171;
          font-size: 0.875rem;
          margin: -0.5rem 0 1rem 0;
        }

        .form-group {
          margin-bottom: 1.25rem;
        }

        .form-group:last-child {
          margin-bottom: 0;
        }

        .form-group label {
          display: block;
          font-size: 0.875rem;
          font-weight: 500;
          color: #3B3B3B;
          margin-bottom: 0.5rem;
        }

        .checkbox-group label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          cursor: pointer;
        }

        .checkbox-label {
          font-size: 0.875rem;
          font-weight: 500;
          color: #3B3B3B;
        }

        input[type="checkbox"] {
          width: 18px;
          height: 18px;
          cursor: pointer;
          accent-color: #6E3FFF;
        }

        input[type="number"],
        input[type="text"],
        select {
          width: 100%;
          padding: 0.5rem 0.75rem;
          border: 1px solid #D8D8D8;
          border-radius: 0.375rem;
          font-size: 0.875rem;
          font-family: inherit;
          transition: all 0.2s;
        }

        input[type="number"]:focus,
        input[type="text"]:focus,
        select:focus {
          outline: none;
          border-color: #6E3FFF;
          box-shadow: 0 0 0 3px rgba(110, 63, 255, 0.1);
        }

        select {
          cursor: pointer;
          background-color: white;
        }

        .help-text {
          display: block;
          font-size: 0.75rem;
          color: #B5B5B5;
          margin-top: 0.25rem;
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.25rem;
        }

        .dimension-inputs {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .dimension-inputs input {
          flex: 1;
        }

        .separator {
          color: #B5B5B5;
          font-size: 1.125rem;
          font-weight: 300;
        }

        .viewport-option {
          margin-bottom: 1rem;
          padding: 1rem;
          background: #F7F7F7;
          border-radius: 0.375rem;
        }

        .viewport-option:last-child {
          margin-bottom: 0;
        }

        .viewport-header {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          cursor: pointer;
          margin-bottom: 0.75rem;
        }

        .viewport-label {
          font-size: 0.875rem;
          font-weight: 500;
          color: #3B3B3B;
        }

        .url-section {
          background: #F7F6FF;
        }

        .url-display {
          margin-bottom: 1rem;
        }

        .url-input {
          width: 100%;
          font-family: monospace;
          font-size: 0.8125rem;
          background: white;
        }

        .info-box {
          background: white;
          border: 1px solid #D9D4FF;
          border-radius: 0.375rem;
          padding: 1rem;
        }

        .info-box strong {
          display: block;
          color: #6E3FFF;
          margin-bottom: 0.5rem;
          font-size: 0.875rem;
        }

        .info-box p {
          margin: 0;
          color: #717171;
          font-size: 0.8125rem;
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

