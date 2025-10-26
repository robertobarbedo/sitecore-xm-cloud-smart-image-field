// components/ImageFind.tsx

"use client";

import { useState, useEffect, useCallback } from 'react';
import { ClientSDK } from '@sitecore-marketplace-sdk/client';
import { searchImagesByText, getAllImages, getUrlParams, ImageSearchResult } from '@/src/lib/supabase-client';
import { getConfig } from '@/src/lib/config';
import { RecommendedInfoPanel } from './RecommendedInfoPanel';

interface ImageFindProps {
  client: ClientSDK;
  onImageSelected?: (imageData: any) => void;
}

type SortField = 'image_name' | 'created_at';
type SortOrder = 'asc' | 'desc';

export function ImageFind({ client, onImageSelected }: ImageFindProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [images, setImages] = useState<ImageSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  const [previewHost, setPreviewHost] = useState<string>('');
  
  // Dimension filters
  const [filterWidth, setFilterWidth] = useState<string>('');
  const [filterHeight, setFilterHeight] = useState<string>('');
  const [approximateDimensions, setApproximateDimensions] = useState(false);
  
  // Aspect ratio filter
  const [filterAspectRatio, setFilterAspectRatio] = useState<string>('');
  
  const imagesPerPage = 10;

  // Common aspect ratios
  const commonAspectRatios = [
    { value: '', label: 'All aspect ratios' },
    { value: '1:1', label: '1:1 (Square)' },
    { value: '4:3', label: '4:3 (Standard)' },
    { value: '3:2', label: '3:2 (Classic)' },
    { value: '16:9', label: '16:9 (Widescreen)' },
    { value: '21:9', label: '21:9 (Ultrawide)' },
    { value: '9:16', label: '9:16 (Portrait)' },
    { value: '2:3', label: '2:3 (Portrait)' },
    { value: '3:4', label: '3:4 (Portrait)' },
  ];

  // Load preview host once on mount
  useEffect(() => {
    const loadPreviewHost = async () => {
      const params = getUrlParams();
      if (!params) return;
      
      try {
        const config = await getConfig(params.organizationId, params.key);
        setPreviewHost(config.previewHost);
      } catch (error) {
        console.error('Error loading preview host:', error);
      }
    };
    
    loadPreviewHost();
  }, []);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      performSearch();
    }, 300); // 300ms debounce

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Re-search when filters or sort changes
  useEffect(() => {
    // Always perform search when filters change, even if current results are empty
    // Wait for preview host to load first
    if (previewHost) {
      performSearch();
    }
  }, [sortField, sortOrder, filterWidth, filterHeight, approximateDimensions, filterAspectRatio, previewHost]);

  const performSearch = async () => {
    const params = getUrlParams();
    if (!params) {
      setError('Missing URL parameters (organizationId and key)');
      return;
    }

    setLoading(true);
    setError('');

    try {
      let results: ImageSearchResult[];

      if (searchQuery.trim()) {
        // Search with query
        results = await searchImagesByText(
          params.organizationId,
          params.key,
          searchQuery,
          100 // Get more results for sorting/pagination
        );
      } else {
        // Get all images if no search query
        results = await getAllImages(
          params.organizationId,
          params.key,
          100
        ) as ImageSearchResult[];
      }

      // Apply dimension and aspect ratio filters
      results = filterResults(results);

      // Sort results
      const sortedResults = sortResults(results);
      setImages(sortedResults);
      setCurrentPage(1); // Reset to first page on new search
    } catch (err) {
      console.error('Search error:', err);
      setError('Failed to search images. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const filterResults = (results: ImageSearchResult[]): ImageSearchResult[] => {
    let filtered = [...results];

    // Filter by dimensions
    if (filterWidth || filterHeight) {
      filtered = filtered.filter(img => {
        const width = img.width || 0;
        const height = img.height || 0;
        const targetWidth = parseInt(filterWidth) || 0;
        const targetHeight = parseInt(filterHeight) || 0;

        if (approximateDimensions) {
          // Allow 10% variance for approximate matching
          const widthMatch = !targetWidth || 
            (width >= targetWidth * 0.9 && width <= targetWidth * 1.1);
          const heightMatch = !targetHeight || 
            (height >= targetHeight * 0.9 && height <= targetHeight * 1.1);
          return widthMatch && heightMatch;
        } else {
          // Exact matching
          const widthMatch = !targetWidth || width === targetWidth;
          const heightMatch = !targetHeight || height === targetHeight;
          return widthMatch && heightMatch;
        }
      });
    }

    // Filter by aspect ratio
    if (filterAspectRatio) {
      filtered = filtered.filter(img => img.aspect_ratio === filterAspectRatio);
    }

    return filtered;
  };

  const sortResults = (results: ImageSearchResult[]) => {
    return [...results].sort((a, b) => {
      let comparison = 0;

      if (sortField === 'image_name') {
        const nameA = (a.image_name || '').toLowerCase();
        const nameB = (b.image_name || '').toLowerCase();
        comparison = nameA.localeCompare(nameB);
      } else {
        // Sort by created_at
        const dateA = new Date(a.created_at || 0).getTime();
        const dateB = new Date(b.created_at || 0).getTime();
        comparison = dateA - dateB;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });
  };

  const handleSelectImage = (image: ImageSearchResult) => {
    setSelectedImageId(image.id || null);
    
    if (onImageSelected && previewHost) {
      const previewUrl = image.image_item_path
        .replace(/^\/sitecore\/media library\//i, previewHost + '-/media/')
        + (image.image_extension ? `.${image.image_extension}` : '');

      onImageSelected({
        path: image.image_item_path.substring(0, image.image_item_path.lastIndexOf('/')),
        itemPath: image.image_item_path,
        itemId: image.image_item_id,
        previewUrl: previewUrl,
        altText: image.alt_text || '',
        description: image.description || '',
        imageName: image.image_name || '',
        imageExtension: image.image_extension || '',
        width: image.width,
        height: image.height,
        sizeKb: image.size_kb,
        aspectRatio: image.aspect_ratio,
        mimeType: image.mime_type,
        focusX: image.focus_x,
        focusY: image.focus_y
      });
    }
  };

  const getPreviewUrl = (imagePath: string, imageExtension?: string) => {
    if (!previewHost) return imagePath;
    return (
      imagePath.replace(/^\/sitecore\/media library\//i, previewHost + '-/media/') +
      (imageExtension ? `.${imageExtension}` : '')
    );
  };

  // Pagination
  const totalPages = Math.ceil(images.length / imagesPerPage);
  const startIndex = (currentPage - 1) * imagesPerPage;
  const endIndex = startIndex + imagesPerPage;
  const currentImages = images.slice(startIndex, endIndex);

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  return (
    <div className="image-find-container">
      <div className="main-layout">
        {/* Left Sidebar - Filters */}
        <div className="filters-sidebar">
          <h3 className="filters-title">Filters</h3>
          
          {/* Dimensions Filter */}
          <div className="filter-section">
            <label className="filter-label">Dimensions</label>
            <div className="dimension-inputs">
              <input
                type="number"
                placeholder="Width"
                style={{ width: '75px' }}
                value={filterWidth}
                onChange={(e) => setFilterWidth(e.target.value)}
                className="dimension-input"
                min="0"
              />
              <span className="dimension-separator">×</span>
              <input
                type="number"
                placeholder="Height"
                style={{ width: '75px' }}
                value={filterHeight}
                onChange={(e) => setFilterHeight(e.target.value)}
                className="dimension-input"
                min="0"
              />
            </div>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={approximateDimensions}
                onChange={(e) => setApproximateDimensions(e.target.checked)}
              />
              <span>Approximate (±10%)</span>
            </label>
          </div>

          {/* Aspect Ratio Filter */}
          <div className="filter-section">
            <label className="filter-label">Aspect Ratio</label>
            <select
              value={filterAspectRatio}
              onChange={(e) => setFilterAspectRatio(e.target.value)}
              className="filter-select"
            >
              {commonAspectRatios.map(ratio => (
                <option key={ratio.value} value={ratio.value}>
                  {ratio.label}
                </option>
              ))}
            </select>
          </div>

          {/* Clear Filters */}
          {(filterWidth || filterHeight || filterAspectRatio) && (
            <button
              onClick={() => {
                setFilterWidth('');
                setFilterHeight('');
                setFilterAspectRatio('');
                setApproximateDimensions(false);
              }}
              className="clear-filters-button"
            >
              Clear Filters
            </button>
          )}
        </div>

        {/* Main Content Area */}
        <div className="content-area">
          {/* Search and Sort Controls */}
          <div className="controls">
            <div className="search-box">
              <input
                type="text"
                placeholder="Search images by name or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
            </div>

            <div className="sort-controls">
              <label>Sort by:</label>
              <select
                value={sortField}
                onChange={(e) => setSortField(e.target.value as SortField)}
                className="sort-select"
              >
                <option value="created_at">Date Created</option>
                <option value="image_name">Name</option>
              </select>

              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="sort-order-button"
                title={sortOrder === 'asc' ? 'Ascending' : 'Descending'}
              >
                {sortOrder === 'asc' ? '↑' : '↓'}
              </button>
            </div>
          </div>

      {/* Recommended Info Panel - replaces results summary */}
      <div className="recommendations-container">
        <RecommendedInfoPanel compact={true} />
      </div>

      {/* Error Message */}
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {/* Image Grid */}
      {!loading && !error && currentImages.length > 0 && (
        <div className="image-grid">
          {currentImages.map((image) => (
            <div
              key={image.id}
              className={`image-card ${selectedImageId === image.id ? 'selected' : ''}`}
              onClick={() => handleSelectImage(image)}
            >
              <div className="image-thumbnail">
                <img
                  src={getPreviewUrl(image.image_item_path, image.image_extension)}
                  alt={image.alt_text || image.image_name || 'Image'}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect fill="%23ddd" width="200" height="200"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3ENo Image%3C/text%3E%3C/svg%3E';
                  }}
                />
              </div>
              <div className="image-info">
                <div className="image-name" title={image.image_name || 'Untitled'}>
                  {image.image_name || 'Untitled'}
                  {image.image_extension && `.${image.image_extension}`}
                </div>
                {image.alt_text && (
                  <div className="image-alt" title={image.alt_text}>
                    {image.alt_text}
                  </div>
                )}
                <div className="image-specs">
                  {image.width && image.height && (
                    <div className="spec-item" title="Dimensions">
                      <svg className="spec-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect x="3" y="3" width="18" height="18" stroke="currentColor" strokeWidth="2"/>
                        <path d="M3 3L21 21M21 3L3 21" stroke="currentColor" strokeWidth="1" opacity="0.3"/>
                      </svg>
                      <span>{image.width}×{image.height}</span>
                    </div>
                  )}
                  {image.aspect_ratio && (
                    <div className="spec-item" title="Aspect Ratio">
                      <svg className="spec-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect x="4" y="7" width="16" height="10" stroke="currentColor" strokeWidth="2"/>
                        <path d="M12 7V17" stroke="currentColor" strokeWidth="1" strokeDasharray="2 2"/>
                      </svg>
                      <span>{image.aspect_ratio}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && images.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">🔍</div>
          <div className="empty-text">
            {searchQuery ? 'No images found matching your search' : 'No images yet'}
          </div>
          <div className="empty-subtext">
            {searchQuery ? 'Try different search terms' : 'Upload your first image to get started'}
          </div>
        </div>
      )}

      {/* Pagination */}
      {!loading && !error && totalPages > 1 && (
        <div className="pagination">
          <button
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage === 1}
            className="pagination-button"
          >
            ← Previous
          </button>

          <div className="pagination-info">
            Page {currentPage} of {totalPages}
          </div>

          <button
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="pagination-button"
          >
            Next →
          </button>
        </div>
      )}
        </div>
      </div>

      <style jsx>{`
        .image-find-container {
          padding: 1rem;
          height: 100%;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
        }

        .main-layout {
          display: flex;
          gap: 1rem;
          height: 100%;
        }

        .filters-sidebar {
          width: 220px;
          flex-shrink: 0;
          background-color: #F7F7F7;
          padding: 1rem;
          border-radius: 0.375rem;
          border: 1px solid #E9E9E9;
        }

        .filters-title {
          font-size: 0.875rem;
          font-weight: 600;
          color: #3B3B3B;
          margin: 0 0 1rem 0;
        }

        .filter-section {
          margin-bottom: 1.25rem;
        }

        .filter-label {
          display: block;
          font-size: 0.75rem;
          font-weight: 500;
          color: #717171;
          margin-bottom: 0.5rem;
        }

        .dimension-inputs {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 0.5rem;
        }

        .dimension-input {
          flex: 1;
          padding: 0.375rem 0.5rem;
          border: 1px solid #D8D8D8;
          border-radius: 0.375rem;
          font-size: 0.8125rem;
          font-family: inherit;
          transition: all 0.2s;
        }

        .dimension-input:focus {
          outline: none;
          border-color: #6E3FFF;
          box-shadow: 0 0 0 3px rgba(110, 63, 255, 0.1);
        }

        .dimension-separator {
          color: #B5B5B5;
          font-size: 0.875rem;
        }

        .checkbox-label {
          display: flex;
          align-items: center;
          gap: 0.375rem;
          font-size: 0.75rem;
          color: #717171;
          cursor: pointer;
        }

        .checkbox-label input[type="checkbox"] {
          cursor: pointer;
          accent-color: #6E3FFF;
        }

        .filter-select {
          width: 100%;
          padding: 0.375rem 0.5rem;
          border: 1px solid #D8D8D8;
          border-radius: 0.375rem;
          font-size: 0.8125rem;
          background-color: white;
          transition: all 0.2s;
        }

        .filter-select:focus {
          outline: none;
          border-color: #6E3FFF;
          box-shadow: 0 0 0 3px rgba(110, 63, 255, 0.1);
        }

        .clear-filters-button {
          width: 100%;
          padding: 0.5rem;
          background-color: white;
          border: 1px solid #D8D8D8;
          border-radius: 0.375rem;
          font-size: 0.75rem;
          color: #717171;
          cursor: pointer;
          transition: all 0.2s;
        }

        .clear-filters-button:hover {
          background-color: #F7F7F7;
          border-color: #B5B5B5;
          color: #3B3B3B;
        }

        .content-area {
          flex: 1;
          min-width: 0;
        }

        .controls {
          display: flex;
          gap: 0.75rem;
          margin-bottom: 1rem;
          flex-wrap: wrap;
        }

        .search-box {
          flex: 1;
          min-width: 200px;
        }

        .search-input {
          width: 100%;
          padding: 0.5rem 0.75rem;
          border: 1px solid #D8D8D8;
          border-radius: 0.375rem;
          font-size: 0.8125rem;
          font-family: inherit;
          transition: all 0.2s;
        }

        .search-input:focus {
          outline: none;
          border-color: #6E3FFF;
          box-shadow: 0 0 0 3px rgba(110, 63, 255, 0.1);
        }

        .sort-controls {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .sort-controls label {
          font-size: 0.8125rem;
          color: #717171;
        }

        .sort-select {
          padding: 0.375rem 0.5rem;
          border: 1px solid #D8D8D8;
          border-radius: 0.375rem;
          font-size: 0.8125rem;
          background-color: white;
          transition: all 0.2s;
        }

        .sort-select:focus {
          outline: none;
          border-color: #6E3FFF;
          box-shadow: 0 0 0 3px rgba(110, 63, 255, 0.1);
        }

        .sort-order-button {
          padding: 0.375rem 0.75rem;
          border: 1px solid #D8D8D8;
          border-radius: 0.375rem;
          background-color: white;
          cursor: pointer;
          font-size: 1rem;
          transition: all 0.2s;
        }

        .sort-order-button:hover {
          background-color: #F7F7F7;
          border-color: #6E3FFF;
        }

        .recommendations-container {
          margin-bottom: 0.75rem;
        }

        .error-message {
          padding: 0.75rem;
          background-color: #FFF5F4;
          border: 1px solid #FFE4E2;
          border-radius: 0.375rem;
          color: #D92739;
          font-size: 0.8125rem;
          margin-bottom: 0.75rem;
        }

        .image-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
          gap: 0.75rem;
          margin-bottom: 1rem;
        }

        .image-card {
          border: 1px solid #E9E9E9;
          border-radius: 0.375rem;
          overflow: hidden;
          cursor: pointer;
          transition: all 0.2s;
          background-color: white;
        }

        .image-card:hover {
          border-color: #6E3FFF;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        }

        .image-card.selected {
          border-color: #6E3FFF;
          box-shadow: 0 0 0 3px rgba(110, 63, 255, 0.3);
        }

        .image-thumbnail {
          width: 100%;
          height: 150px;
          background-color: #F7F7F7;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }

        .image-thumbnail img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .image-info {
          padding: 0.5rem;
        }

        .image-name {
          font-size: 0.75rem;
          font-weight: 500;
          color: #3B3B3B;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          margin-bottom: 0.25rem;
        }

        .image-alt {
          font-size: 0.6875rem;
          color: #717171;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          margin-bottom: 0.25rem;
        }

        .image-specs {
          display: flex;
          gap: 0.5rem;
          margin-bottom: 0.25rem;
          flex-wrap: wrap;
        }

        .spec-item {
          display: flex;
          align-items: center;
          gap: 0.1875rem;
          font-size: 0.625rem;
          color: #717171;
          background-color: #F7F7F7;
          padding: 0.125rem 0;
          border-radius: 0.125rem;
        }

        .spec-icon {
          width: 12px;
          height: 12px;
          color: #B5B5B5;
          flex-shrink: 0;
        }

        .spec-item span {
          white-space: nowrap;
        }

        .image-date {
          font-size: 0.6875rem;
          color: #B5B5B5;
        }

        .empty-state {
          text-align: center;
          padding: 3.75rem 1.25rem;
        }

        .empty-icon {
          font-size: 3rem;
          margin-bottom: 1rem;
          opacity: 0.5;
        }

        .empty-text {
          font-size: 0.875rem;
          color: #717171;
          margin-bottom: 0.5rem;
        }

        .empty-subtext {
          font-size: 0.75rem;
          color: #B5B5B5;
        }

        .pagination {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 1rem;
          padding: 1rem 0;
          border-top: 1px solid #E9E9E9;
        }

        .pagination-button {
          padding: 0.375rem 0.75rem;
          border: 1px solid #D8D8D8;
          border-radius: 0.375rem;
          background-color: white;
          cursor: pointer;
          font-size: 0.8125rem;
          transition: all 0.2s;
        }

        .pagination-button:hover:not(:disabled) {
          background-color: #6E3FFF;
          color: white;
          border-color: #6E3FFF;
        }

        .pagination-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .pagination-info {
          font-size: 0.8125rem;
          color: #717171;
        }
      `}</style>
    </div>
  );
}
