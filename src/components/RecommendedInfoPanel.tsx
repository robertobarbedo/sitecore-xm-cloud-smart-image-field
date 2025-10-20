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
}

export function RecommendedInfoPanel({ uploadedImage }: RecommendedInfoPanelProps) {
  const [recommendedWidth, setRecommendedWidth] = useState<number | null>(null);
  const [recommendedHeight, setRecommendedHeight] = useState<number | null>(null);
  const [recommendedSizeKb, setRecommendedSizeKb] = useState<number | null>(null);
  const [recommendedAspectRatio, setRecommendedAspectRatio] = useState<string | null>(null);

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
      <div className="recommendations-banner">
        <span className="recommendations-title">Recommended:</span>
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
          background-color: #e3f2fd;
          border: 1px solid #90caf9;
          border-radius: 4px;
          padding: 10px 16px;
          margin-bottom: 16px;
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }

        .recommendations-title {
          font-size: 13px;
          font-weight: 600;
          color: #1565c0;
        }

        .recommendations-list {
          font-size: 12px;
          color: #1976d2;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }

        .recommendations-list strong {
          color: #0d47a1;
          margin-right: 4px;
        }

        .separator {
          color: #90caf9;
          margin: 0 4px;
        }

        .validation-results {
          background-color: #fafafa;
          border: 1px solid #e0e0e0;
          border-radius: 4px;
          padding: 12px 16px;
          margin-bottom: 16px;
        }

        .validation-match {
          font-size: 12px;
          color: #2e7d32;
          margin-bottom: 4px;
        }

        .validation-warning {
          font-size: 12px;
          color: #f57c00;
          margin-bottom: 4px;
        }
      `}</style>
    </>
  );
}

