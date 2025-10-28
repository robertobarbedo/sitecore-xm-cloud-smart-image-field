"use client";

import { useState, useEffect } from 'react';
import { ClientSDK } from '@sitecore-marketplace-sdk/client';
import { Library } from '../types/library';
import { createLibrariesStorage } from '@/src/lib/storage';
import { createSettingsStorage } from '@/src/lib/storage';
import { generateLibraryKey } from '../lib/supabase-admin';
import { getAdminUrlParams } from '../lib/url-parser';
import { LibraryList } from './LibraryList';
import { LibraryForm } from './LibraryForm';
import { ConfirmDialog } from './ConfirmDialog';
import { UrlGenerator } from './UrlGenerator';
import { SettingsComponent } from './Settings';

interface LibraryManagerProps {
  client: ClientSDK;
}

type ViewMode = 'list' | 'create' | 'edit' | 'generate-url' | 'settings';

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
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  // Get organization ID from URL on mount
  useEffect(() => {
    const params = getAdminUrlParams();
    if (params.organizationId) {
      setOrganizationId(params.organizationId);
    } else {
      setError('Organization ID not found in URL parameters');
    }
  }, []);

  // Load libraries when organization ID is available
  useEffect(() => {
    if (organizationId) {
      loadLibraries();
    }
  }, [organizationId]);

  const loadLibraries = async () => {
    if (!organizationId) {
      setError('Organization ID is required');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError('');

      // Create storage instances
      const settingsStorage = createSettingsStorage(client);
      const librariesStorage = createLibrariesStorage(client);

      // FIRST: Check if settings exist (required before libraries)
      const settingsExist = await settingsStorage.hasSettings(organizationId);
      
      if (!settingsExist) {
        // No settings - must configure settings first
        console.log('⚙️ No settings found - showing settings form for first-time user...');
        setViewMode('settings');
        setLibraries([]);
        setIsLoading(false);
        return;
      }

      // SECOND: Check if there are ANY libraries already for this organization
      const hasLibraries = await librariesStorage.hasAnyLibraries(organizationId);

      // If NO libraries exist (first time user), show editor with pre-populated fields
      if (!hasLibraries) {
        console.log('📚 No libraries found - showing editor for first-time user...');
        const newMainLibrary: Library = {
          key: generateLibraryKey(),
          name: 'Main Library',
          folder: '/sitecore/media library/Images/Main Library',
        };

        setSelectedLibrary(newMainLibrary);
        setViewMode('create');
        setLibraries([]); // Empty list
      } else {
        // Libraries exist, load them
        console.log('📚 Libraries exist, loading...');
        const loadedLibraries = await librariesStorage.getLibraries(organizationId);
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
    if (!organizationId) {
      setError('Organization ID is required');
      return;
    }

    try {
      setIsSaving(true);
      setError('');

      const librariesStorage = createLibrariesStorage(client);

      if (viewMode === 'create') {
        const created = await librariesStorage.saveLibrary(organizationId, library);
        setLibraries((prev) => [...prev, created]);
        console.log('✅ Library created successfully:', created.name);
      } else if (viewMode === 'edit') {
        const updated = await librariesStorage.saveLibrary(organizationId, library);
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
    
    if (!organizationId) {
      console.error('❌ No organization ID');
      setError('Organization ID is required');
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
      console.log('⏳ Archiving library...');
      setError('');
      
      const librariesStorage = createLibrariesStorage(client);
      await librariesStorage.archiveLibrary(organizationId, library);
      
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

  const handleOpenSettings = () => {
    setViewMode('settings');
  };

  const handleSettingsSaved = async () => {
    // After settings are saved in first-time setup, check for libraries
    console.log('⏳ Settings saved, checking for libraries...');
    
    const librariesStorage = createLibrariesStorage(client);
    const hasLibraries = await librariesStorage.hasAnyLibraries(organizationId);
    
    if (!hasLibraries) {
      // No libraries - show library form
      console.log('📚 No libraries found - showing library editor...');
      const newMainLibrary: Library = {
        key: generateLibraryKey(),
        name: 'Main Library',
        folder: '/sitecore/media library/Images/Main Library',
      };
      setSelectedLibrary(newMainLibrary);
      setViewMode('create');
    } else {
      // Libraries exist (shouldn't happen but handle it)
      console.log('📚 Libraries exist, loading...');
      await loadLibraries();
    }
  };

  return (
    <div className="library-manager">
      <div className="header">
        <h1>Library Management</h1>
        {viewMode === 'list' && (
          <button className="btn-settings" onClick={handleOpenSettings} title="Settings">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M10 12.5C11.3807 12.5 12.5 11.3807 12.5 10C12.5 8.61929 11.3807 7.5 10 7.5C8.61929 7.5 7.5 8.61929 7.5 10C7.5 11.3807 8.61929 12.5 10 12.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M16.1667 12.5C16.0557 12.7513 16.0226 13.0302 16.0717 13.3005C16.1209 13.5708 16.2501 13.8203 16.4417 14.0167L16.4917 14.0667C16.6362 14.2109 16.7508 14.3826 16.8288 14.5714C16.9068 14.7602 16.9469 14.9625 16.9469 15.1667C16.9469 15.3708 16.9068 15.5731 16.8288 15.7619C16.7508 15.9507 16.6362 16.1224 16.4917 16.2667C16.3474 16.4111 16.1757 16.5257 15.9869 16.6037C15.7981 16.6817 15.5958 16.7219 15.3917 16.7219C15.1875 16.7219 14.9852 16.6817 14.7964 16.6037C14.6076 16.5257 14.4359 16.4111 14.2917 16.2667L14.2417 16.2167C14.0453 16.0251 13.7958 15.8958 13.5255 15.8467C13.2552 15.7976 12.9763 15.8306 12.725 15.9417C12.4787 16.0479 12.2699 16.2253 12.1261 16.4515C11.9822 16.6778 11.9095 16.9429 11.9167 17.2117V17.5C11.9167 17.9188 11.7504 18.3204 11.453 18.6186C11.1555 18.9167 10.7542 19.0833 10.3333 19.0833C9.91242 19.0833 9.51109 18.9167 9.21368 18.6186C8.91627 18.3204 8.75 17.9188 8.75 17.5V17.425C8.75111 17.1465 8.6708 16.8737 8.51881 16.6399C8.36681 16.4061 8.14979 16.222 7.89583 16.1083C7.64449 15.9973 7.36564 15.9642 7.09531 16.0133C6.82499 16.0624 6.57549 16.1918 6.37917 16.3833L6.32917 16.4333C6.18489 16.5778 6.01323 16.6924 5.82443 16.7704C5.63563 16.8484 5.43334 16.8885 5.22917 16.8885C5.025 16.8885 4.82271 16.8484 4.63391 16.7704C4.44511 16.6924 4.27345 16.5778 4.12917 16.4333C3.98469 16.289 3.87012 16.1174 3.79212 15.9286C3.71411 15.7398 3.67399 15.5375 3.67399 15.3333C3.67399 15.1292 3.71411 14.9269 3.79212 14.7381C3.87012 14.5493 3.98469 14.3776 4.12917 14.2333L4.17917 14.1833C4.37067 13.987 4.49998 13.7375 4.54909 13.4672C4.5982 13.1969 4.56517 12.918 4.45417 12.6667C4.34795 12.4203 4.17056 12.2116 3.94429 12.0677C3.71802 11.9238 3.45289 11.8512 3.18417 11.8583H2.91667C2.49783 11.8583 2.09651 11.692 1.7991 11.3946C1.50168 11.0972 1.33333 10.6959 1.33333 10.275C1.33333 9.85415 1.50168 9.45283 1.7991 9.15541C2.09651 8.858 2.49783 8.69167 2.91667 8.69167H2.99167C3.27018 8.69055 3.54297 8.61024 3.77676 8.45825C4.01055 8.30625 4.19468 8.08923 4.30833 7.83333C4.41933 7.58199 4.45237 7.30315 4.40326 7.03282C4.35415 6.7625 4.22484 6.51299 4.03333 6.31667L3.98333 6.26667C3.83885 6.12238 3.72428 5.95072 3.64628 5.76192C3.56828 5.57312 3.52816 5.37084 3.52816 5.16667C3.52816 4.9625 3.56828 4.76021 3.64628 4.57141C3.72428 4.38261 3.83885 4.21095 3.98333 4.06667C4.12761 3.92219 4.29928 3.80762 4.48807 3.72961C4.67687 3.65161 4.87916 3.61149 5.08333 3.61149C5.2875 3.61149 5.48979 3.65161 5.67859 3.72961C5.86739 3.80762 6.03905 3.92219 6.18333 4.06667L6.23333 4.11667C6.42966 4.30817 6.67916 4.43748 6.94949 4.48659C7.21981 4.5357 7.49866 4.50266 7.75 4.39167H7.83333C8.07971 4.28544 8.28836 4.10805 8.43227 3.88179C8.57618 3.65552 8.64879 3.39039 8.64167 3.12167V2.85417C8.64167 2.43532 8.80801 2.034 9.10542 1.73659C9.40284 1.43917 9.80416 1.27083 10.225 1.27083C10.6458 1.27083 11.0472 1.43917 11.3446 1.73659C11.642 2.034 11.8083 2.43532 11.8083 2.85417V2.92917C11.8015 3.19789 11.8741 3.46302 12.018 3.68928C12.1619 3.91555 12.3705 4.09294 12.6167 4.19917C12.868 4.31016 13.1469 4.3432 13.4172 4.29409C13.6875 4.24498 13.937 4.11567 14.1333 3.92417L14.1833 3.87417C14.3276 3.72968 14.4993 3.61512 14.6881 3.53711C14.8769 3.45911 15.0792 3.41899 15.2833 3.41899C15.4875 3.41899 15.6898 3.45911 15.8786 3.53711C16.0674 3.61512 16.2391 3.72968 16.3833 3.87417C16.5278 4.01845 16.6424 4.19011 16.7204 4.37891C16.7984 4.56771 16.8385 4.77 16.8385 4.97417C16.8385 5.17834 16.7984 5.38063 16.7204 5.56943C16.6424 5.75823 16.5278 5.92989 16.3833 6.07417L16.3333 6.12417C16.1418 6.32049 16.0125 6.57 15.9634 6.84032C15.9143 7.11065 15.9473 7.38949 16.0583 7.64083V7.725C16.1646 7.97138 16.342 8.18003 16.5682 8.32394C16.7945 8.46785 17.0596 8.54046 17.3283 8.53333H17.5833C18.0022 8.53333 18.4035 8.69967 18.7009 8.99708C18.9983 9.29449 19.1667 9.69582 19.1667 10.1167C19.1667 10.5375 18.9983 10.9388 18.7009 11.2362C18.4035 11.5337 18.0022 11.7 17.5833 11.7H17.5083C17.2396 11.6929 16.9745 11.7655 16.7482 11.9094C16.5219 12.0533 16.3445 12.2619 16.2383 12.5083V12.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span>Settings</span>
          </button>
        )}
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

      {viewMode === 'settings' && (
        <SettingsComponent
          client={client}
          organizationId={organizationId}
          onBack={handleBackToList}
          isFirstTimeSetup={libraries.length === 0}
          onSettingsSaved={libraries.length === 0 ? handleSettingsSaved : undefined}
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

        .btn-settings {
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
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .btn-settings:hover {
          background-color: #5319E0;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
          transform: translateY(-1px);
        }

        .btn-settings svg {
          width: 16px;
          height: 16px;
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

