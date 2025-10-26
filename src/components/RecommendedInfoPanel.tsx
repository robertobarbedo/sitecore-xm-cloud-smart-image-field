// components/RecommendedInfoPanel.tsx

"use client";

import { useState, useEffect } from 'react';

interface RecommendedInfoPanelProps {
  // Optional uploaded image data for validation
  uploadedImage?: {
    width?: number;
    height?: number;
    sizeKb?: number;
    aspectRatio?: string;
  } | null;
  // Control whether to show margins (default: true for backward compatibility)
  compact?: boolean;
}

export function RecommendedInfoPanel({ uploadedImage, compact = false }: RecommendedInfoPanelProps) {
  const [recommendedWidth, setRecommendedWidth] = useState<number | null>(null);
  const [recommendedHeight, setRecommendedHeight] = useState<number | null>(null);
  const [recommendedSizeKb, setRecommendedSizeKb] = useState<number | null>(null);
  const [recommendedAspectRatio, setRecommendedAspectRatio] = useState<string | null>(null);
  const [showTooltip, setShowTooltip] = useState(false);

  // Parse URL query parameters for recommendations
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      
      // Parse oridim (e.g., "1920x1080")
      const oridim = urlParams.get('oridim');
      if (oridim) {
        const [width, height] = oridim.split('x').map(d => parseInt(d));
        if (width && height) {
          setRecommendedWidth(width);
          setRecommendedHeight(height);
        }
      }
      
      // Parse orisizekb (e.g., "600")
      const orisizekb = urlParams.get('orisizekb');
      if (orisizekb) {
        const size = parseInt(orisizekb);
        if (size) {
          setRecommendedSizeKb(size);
        }
      }

      // Parse oriaspect (e.g., "3per2" -> "3:2", "16per9" -> "16:9")
      const oriaspect = urlParams.get('oriaspect');
      if (oriaspect) {
        const aspectRatio = oriaspect.replace('per', ':');
        setRecommendedAspectRatio(aspectRatio);
      }
    }
  }, []);

  // Check if uploaded image matches recommendations
  const checkRecommendations = () => {
    if (!uploadedImage) return null;
    
    const issues = [];
    const matches = [];
    
    // Check dimensions
    if (recommendedWidth && recommendedHeight) {
      const dimensionsMatch = uploadedImage.width === recommendedWidth && uploadedImage.height === recommendedHeight;
      if (dimensionsMatch) {
        matches.push(`✓ Dimensions: ${uploadedImage.width}×${uploadedImage.height}`);
      } else {
        issues.push(`⚠ Dimensions: ${uploadedImage.width}×${uploadedImage.height} (recommended: ${recommendedWidth}×${recommendedHeight})`);
      }
    }
    
    // Check file size
    if (recommendedSizeKb && uploadedImage.sizeKb) {
      const sizeMatch = uploadedImage.sizeKb <= recommendedSizeKb;
      if (sizeMatch) {
        matches.push(`✓ Size: ${uploadedImage.sizeKb} KB`);
      } else {
        issues.push(`⚠ Size: ${uploadedImage.sizeKb} KB (recommended: ≤${recommendedSizeKb} KB)`);
      }
    }

    // Check aspect ratio
    if (recommendedAspectRatio && uploadedImage.aspectRatio) {
      const aspectMatch = uploadedImage.aspectRatio === recommendedAspectRatio;
      if (aspectMatch) {
        matches.push(`✓ Aspect Ratio: ${uploadedImage.aspectRatio}`);
      } else {
        issues.push(`⚠ Aspect Ratio: ${uploadedImage.aspectRatio} (recommended: ${recommendedAspectRatio})`);
      }
    }
    
    return { issues, matches };
  };

  const recommendations = checkRecommendations();
  const hasRecommendations = recommendedWidth || recommendedHeight || recommendedSizeKb || recommendedAspectRatio;

  if (!hasRecommendations) {
    return null; // Don't render anything if no recommendations
  }

  return (
    <>
      {/* Show recommendations banner */}
      <div className={`recommendations-banner ${compact ? 'compact' : ''}`}>
        <span 
          className="info-icon-wrapper"
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
        >
          <svg 
            className="info-icon" 
            viewBox="0 0 24 24" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
            <path d="M12 16V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            <circle cx="12" cy="8" r="1" fill="currentColor"/>
          </svg>
          {showTooltip && (
            <span className="tooltip">
              These are the recommended specifications for this image.
            </span>
          )}
        </span>
        <span className="recommendations-list">
          {(recommendedWidth && recommendedHeight) && (
            <>
              <strong>Dimensions:</strong> {recommendedWidth}×{recommendedHeight}px
            </>
          )}
          {recommendedAspectRatio && (
            <>
              {(recommendedWidth && recommendedHeight) && <span className="separator">•</span>}
              <strong>Aspect Ratio:</strong> {recommendedAspectRatio}
            </>
          )}
          {recommendedSizeKb && (
            <>
              {((recommendedWidth && recommendedHeight) || recommendedAspectRatio) && <span className="separator">•</span>}
              <strong>Size:</strong> ≤{recommendedSizeKb} KB
            </>
          )}
        </span>
      </div>

      {/* Show validation results after upload */}
      {recommendations && (recommendations.issues.length > 0 || recommendations.matches.length > 0) && (
        <div className="validation-results">
          {recommendations.matches.map((match, i) => (
            <div key={`match-${i}`} className="validation-match">{match}</div>
          ))}
          {recommendations.issues.map((issue, i) => (
            <div key={`issue-${i}`} className="validation-warning">{issue}</div>
          ))}
        </div>
      )}

      <style jsx>{`
        .recommendations-banner {
          border-radius: 0.25rem;
          padding: 0.625rem 1rem;
          margin-bottom: 1rem;
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 0.5rem;
          flex-wrap: wrap;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
        }

        .recommendations-banner.compact {
          padding: 0;
          margin-bottom: 0;
          border-radius: 0;
          justify-content: flex-start;
        }

        .info-icon-wrapper {
          position: relative;
          display: inline-flex;
          align-items: center;
          cursor: help;
        }

        .info-icon {
          width: 18px;
          height: 18px;
          color: #6E3FFF;
          transition: color 0.2s;
        }

        .info-icon-wrapper:hover .info-icon {
          color: #5319E0;
        }

        .tooltip {
          position: absolute;
          top: 100%;
          left: 50%;
          transform: translateX(-50%);
          margin-top: 0.5rem;
          background-color: #3B3B3B;
          color: white;
          padding: 0.5rem 0.75rem;
          border-radius: 0.25rem;
          font-size: 0.75rem;
          white-space: nowrap;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
          z-index: 1000;
        }

        .tooltip::after {
          content: '';
          position: absolute;
          bottom: 100%;
          left: 50%;
          transform: translateX(-50%);
          border: 6px solid transparent;
          border-bottom-color: #3B3B3B;
        }

        .recommendations-list {
          font-size: 0.75rem;
          color: #6E3FFF;
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          flex-wrap: wrap;
        }

        .recommendations-list strong {
          color: #5319E0;
          margin-right: 0.25rem;
        }

        .separator {
          color: #D9D4FF;
          margin: 0 0.25rem;
        }

        .validation-results {
          background-color: #F7F7F7;
          border: 1px solid #E9E9E9;
          border-radius: 0.25rem;
          padding: 0.75rem 1rem;
          margin-bottom: 1rem;
        }

        .validation-match {
          font-size: 0.75rem;
          color: #0EA184;
          margin-bottom: 0.25rem;
        }

        .validation-warning {
          font-size: 0.75rem;
          color: #FF7D00;
          margin-bottom: 0.25rem;
        }
      `}</style>
    </>
  );
}

