"use client";

import { useState, useEffect } from 'react';
import { ClientSDK } from '@sitecore-marketplace-sdk/client';
import { Library } from '../types/library';
import {
  listLibraries,
  createLibrary,
  updateLibrary,
  archiveLibrary,
  generateLibraryKey,
  hasAnyLibraries,
} from '../lib/supabase-admin';
import { getAdminUrlParams } from '../lib/url-parser';
import { LibraryList } from './LibraryList';
import { LibraryForm } from './LibraryForm';
import { ConfirmDialog } from './ConfirmDialog';
import { UrlGenerator } from './UrlGenerator';

interface LibraryManagerProps {
  client: ClientSDK;
}

type ViewMode = 'list' | 'create' | 'edit' | 'generate-url';

interface ConfirmDialogState {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
}

export function LibraryManager({ client }: LibraryManagerProps) {
  const [libraries, setLibraries] = useState<Library[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedLibrary, setSelectedLibrary] = useState<Library | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [organizationId, setOrganizationId] = useState<string>('');
  const [marketplaceAppTenantId, setMarketplaceAppTenantId] = useState<string>('');
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  // Get organization ID and marketplace app tenant ID from URL on mount
  useEffect(() => {
    const params = getAdminUrlParams();
    if (params.organizationId) {
      setOrganizationId(params.organizationId);
    } else {
      setError('Organization ID not found in URL parameters');
    }
    
    if (params.marketplaceAppTenantId) {
      setMarketplaceAppTenantId(params.marketplaceAppTenantId);
    } else {
      setError('Marketplace App Tenant ID not found in URL parameters');
    }
  }, []);

  // Load libraries when both IDs are available
  useEffect(() => {
    if (organizationId && marketplaceAppTenantId) {
      loadLibraries();
    }
  }, [organizationId, marketplaceAppTenantId]);

  const loadLibraries = async () => {
    if (!organizationId || !marketplaceAppTenantId) {
      setError('Organization ID and Marketplace App Tenant ID are required');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError('');

      // Check if there are ANY libraries already for this organization and tenant
      const hasLibraries = await hasAnyLibraries(organizationId, marketplaceAppTenantId);

      // If NO libraries exist (first time user), show editor with pre-populated fields
      if (!hasLibraries) {
        console.log('📚 No libraries found - showing editor for first-time user...');
        const newMainLibrary: Library = {
          key: generateLibraryKey(),
          name: 'Main Library',
          folder: '/sitecore/media library/Images/Main Library',
          previewHost: '', // Empty - user must enter this manually
        };

        setSelectedLibrary(newMainLibrary);
        setViewMode('create');
        setLibraries([]); // Empty list
      } else {
        // Libraries exist, load them
        console.log('📚 Libraries exist, loading...');
        const loadedLibraries = await listLibraries(organizationId, marketplaceAppTenantId);
        setLibraries(loadedLibraries);
        setViewMode('list');
      }
    } catch (err) {
      console.error('Error loading libraries:', err);
      setError(err instanceof Error ? err.message : 'Failed to load libraries');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateNew = () => {
    const newLibrary: Library = {
      key: generateLibraryKey(),
      name: '',
      folder: '/sitecore/media library/Images/',
      previewHost: '', // Empty - user must enter this manually
    };
    setSelectedLibrary(newLibrary);
    setViewMode('create');
  };

  const handleEdit = (library: Library) => {
    setSelectedLibrary(library);
    setViewMode('edit');
  };

  const handleGenerateUrl = (library: Library) => {
    setSelectedLibrary(library);
    setViewMode('generate-url');
  };

  const handleSave = async (library: Library) => {
    if (!organizationId || !marketplaceAppTenantId) {
      setError('Organization ID and Marketplace App Tenant ID are required');
      return;
    }

    try {
      setIsSaving(true);
      setError('');

      if (viewMode === 'create') {
        const created = await createLibrary(organizationId, marketplaceAppTenantId, library);
        setLibraries((prev) => [...prev, created]);
        console.log('✅ Library created successfully:', created.name);
      } else if (viewMode === 'edit') {
        const updated = await updateLibrary(organizationId, marketplaceAppTenantId, library);
        setLibraries((prev) =>
          prev.map((lib) => (lib.key === library.key ? updated : lib))
        );
        console.log('✅ Library updated successfully:', updated.name);
      }

      setViewMode('list');
      setSelectedLibrary(null);
    } catch (err) {
      console.error('Error saving library:', err);
      setError(err instanceof Error ? err.message : 'Failed to save library');
      throw err; // Re-throw to prevent form from closing on error
    } finally {
      setIsSaving(false);
    }
  };

  const handleArchive = (library: Library) => {
    console.log('📦 Archive button clicked for library:', library.name, library.key);
    
    if (!organizationId || !marketplaceAppTenantId) {
      console.error('❌ No organization ID or marketplace app tenant ID');
      setError('Organization ID and Marketplace App Tenant ID are required');
      return;
    }

    if (library.name === 'Main Library') {
      console.warn('⚠️ Attempted to archive Main Library');
      setError('Cannot archive Main Library');
      return;
    }

    // Show custom confirmation dialog
    setConfirmDialog({
      isOpen: true,
      title: 'Archive Library',
      message: `WARNING: This operation cannot be undone!\n\nAre you sure you want to archive the library "${library.name}"?\n\nArchived libraries will be hidden from the list and cannot be restored through the interface.`,
      onConfirm: () => performArchive(library),
    });
  };

  const performArchive = async (library: Library) => {
    setConfirmDialog({ isOpen: false, title: '', message: '', onConfirm: () => {} });

    try {
      console.log('⏳ Archiving library in Supabase...');
      setError('');
      await archiveLibrary(organizationId, marketplaceAppTenantId, library);
      console.log('✅ Library archived, updating UI...');
      setLibraries((prev) => prev.filter((lib) => lib.key !== library.key));
      console.log('✅ UI updated successfully');
    } catch (err) {
      console.error('❌ Error archiving library:', err);
      setError(err instanceof Error ? err.message : 'Failed to archive library');
    }
  };

  const closeConfirmDialog = () => {
    console.log('⏸️ Archive cancelled by user');
    setConfirmDialog({ isOpen: false, title: '', message: '', onConfirm: () => {} });
  };

  const handleCancel = async () => {
    // If cancelling during first-time setup (no libraries), reload to check again
    if (libraries.length === 0) {
      console.log('⏸️ First-time setup cancelled - reloading libraries...');
      await loadLibraries();
    } else {
      setViewMode('list');
      setSelectedLibrary(null);
    }
  };

  const handleBackToList = () => {
    setViewMode('list');
    setSelectedLibrary(null);
  };

  return (
    <div className="library-manager">
      <div className="header">
        <h1>Library Management</h1>
        {/* Hidden for now - will be enabled in future releases */}
        {/* {viewMode === 'list' && (
          <button className="btn-create" onClick={handleCreateNew}>
            + Create New Library
          </button>
        )} */}
      </div>

      {error && (
        <div className="error-banner">
          <strong>Error:</strong> {error}
        </div>
      )}

      {viewMode === 'list' && (
        <LibraryList
          libraries={libraries}
          onEdit={handleEdit}
          onArchive={handleArchive}
          onGenerateUrl={handleGenerateUrl}
          isLoading={isLoading}
        />
      )}

      {viewMode === 'generate-url' && selectedLibrary && (
        <UrlGenerator
          library={selectedLibrary}
          onBack={handleBackToList}
        />
      )}

      {(viewMode === 'create' || viewMode === 'edit') && selectedLibrary && (
        <div className="form-container">
          {isSaving && (
            <div className="saving-overlay">
              <div className="saving-message">Saving...</div>
            </div>
          )}
          <LibraryForm
            library={selectedLibrary}
            onSave={handleSave}
            onCancel={handleCancel}
            isMainLibrary={selectedLibrary.name === 'Main Library'}
            existingLibraries={libraries}
            isFirstTimeSetup={viewMode === 'create' && libraries.length === 0}
          />
        </div>
      )}

      {/* Custom Confirmation Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmText="Archive"
        cancelText="Cancel"
        onConfirm={confirmDialog.onConfirm}
        onCancel={closeConfirmDialog}
        type="warning"
      />

      <style jsx>{`
        .library-manager {
          min-height: 100vh;
          background-color: #ffffff;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
        }

        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.5rem 1.5rem 1rem 1.5rem;
          border-bottom: 1px solid #E9E9E9;
        }

        h1 {
          font-size: 1.5rem;
          font-weight: 600;
          color: #3B3B3B;
          margin: 0;
        }

        .btn-create {
          background-color: #6E3FFF;
          color: white;
          border: none;
          padding: 0.625rem 1.25rem;
          border-radius: 9999px;
          cursor: pointer;
          font-size: 0.875rem;
          font-weight: 500;
          transition: all 0.2s;
          box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
        }

        .btn-create:hover {
          background-color: #5319E0;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
          transform: translateY(-1px);
        }

        .error-banner {
          background-color: #FFF5F4;
          border: 1px solid #FFE4E2;
          border-radius: 0.375rem;
          padding: 0.75rem 1.5rem;
          margin: 1rem 1.5rem;
          color: #D92739;
        }

        .error-banner strong {
          font-weight: 600;
        }

        .form-container {
          position: relative;
        }

        .saving-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(255, 255, 255, 0.9);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10;
        }

        .saving-message {
          font-size: 1rem;
          font-weight: 500;
          color: #6E3FFF;
        }
      `}</style>
    </div>
  );
}

