"use client";

import { useState, useEffect } from 'react';
import { ClientSDK } from '@sitecore-marketplace-sdk/client';
import { Settings } from '../types/library';
import { SitecoreSettingsStorage } from '@/src/lib/storage/sitecore-settings-storage';
import { validatePreviewHost, normalizePreviewHost } from '../lib/url-parser';

interface SettingsProps {
  client: ClientSDK;
  organizationId: string;
  onBack: () => void;
  onSettingsSaved?: () => void; // Callback for when settings are saved (for first-time setup)
  isFirstTimeSetup?: boolean; // Hide back button during first-time setup
}

export function SettingsComponent({ client, organizationId, onBack, onSettingsSaved, isFirstTimeSetup = false }: SettingsProps) {
  const [formData, setFormData] = useState<Settings>({
    preview_host: '',
    client_id: '',
    client_secret: '',
  });
  const [errors, setErrors] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    loadSettings();
  }, [organizationId]);

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      
      const settingsStorage = new SitecoreSettingsStorage(client);
      const settings = await settingsStorage.getSettings(organizationId);
      
      if (settings) {
        setFormData(settings);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      setErrors(['Failed to load settings. Please try again.']);
    } finally {
      setIsLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const validationErrors: string[] = [];

    if (!formData.preview_host.trim()) {
      validationErrors.push('Preview Host is required');
    } else if (!validatePreviewHost(formData.preview_host)) {
      validationErrors.push('Preview Host must be a valid HTTPS URL ending with .sitecorecloud.io');
    }

    if (!formData.client_id?.trim()) {
      validationErrors.push('Client ID is required');
    }

    if (!formData.client_secret?.trim()) {
      validationErrors.push('Client Secret is required');
    }

    setErrors(validationErrors);
    return validationErrors.length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setIsSaving(true);
      setErrors([]);
      setSuccessMessage('');

      const normalizedSettings = {
        ...formData,
        preview_host: normalizePreviewHost(formData.preview_host),
      };

      const settingsStorage = new SitecoreSettingsStorage(client);
      await settingsStorage.saveSettings(organizationId, normalizedSettings);
      
      setSuccessMessage('Settings saved successfully!');
      
      // If this is first-time setup, notify parent to continue to library setup
      if (isFirstTimeSetup && onSettingsSaved) {
        console.log('✅ First-time settings saved, proceeding to library setup...');
        setTimeout(() => {
          onSettingsSaved();
        }, 500); // Small delay to show success message
      } else {
        // Clear success message after 3 seconds for regular edits
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      setErrors(['Failed to save settings. Please try again.']);
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (field: keyof Settings, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    // Clear messages when user starts typing
    setErrors([]);
    setSuccessMessage('');
  };

  if (isLoading) {
    return (
      <div className="settings-container">
        <div className="loading">Loading settings...</div>
        <style jsx>{`
          .settings-container {
            padding: 1.5rem;
          }
          .loading {
            text-align: center;
            color: #717171;
            padding: 2rem;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="settings-container">
      <div className="settings-header">
        {!isFirstTimeSetup && (
          <button onClick={onBack} className="back-button">
            ← Back to Libraries
          </button>
        )}
        <h2>{isFirstTimeSetup ? 'Welcome! Configure Settings' : 'Settings'}</h2>
        {isFirstTimeSetup && (
          <p className="setup-message">
            Please configure your settings first before creating your Main Library.
          </p>
        )}
      </div>

      {errors.length > 0 && (
        <div className="error-box">
          <strong>Please fix the following errors:</strong>
          <ul>
            {errors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      {successMessage && (
        <div className="success-box">
          <strong>✓ {successMessage}</strong>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>
            Preview Host: <span className="required">*</span>
          </label>
          <input
            type="text"
            value={formData.preview_host}
            onChange={(e) => handleChange('preview_host', e.target.value)}
            placeholder="https://xmc-tenant.sitecorecloud.io/"
            required
          />
          <small className="help-text">
            Must end with .sitecorecloud.io. This is the value seen in the Content Editor URL. 
            Example: https://xmc-yourtenantname.sitecorecloud.io/
          </small>
        </div>

        <div className="form-section-divider"></div>

        <div className="form-section-header">
          <h3>Environment Credentials</h3>
          <div className="credentials-help">
            <p>
              To use advanced features like automated image processing, you need to create Automation credentials in Sitecore Cloud.
            </p>
            {organizationId && (
              <p>
                <a 
                  href={`https://deploy.sitecorecloud.io/credentials/environment?organization=${organizationId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="credentials-link"
                >
                  Ctrl + Click here to create Automation credentials →
                </a>
              </p>
            )}
            <p className="help-note">
              💡 Create a new credential of type <strong>Automation</strong>, then copy and paste the Client ID and Client Secret below.
            </p>
          </div>
        </div>

        <div className="form-group">
          <label>
            Client ID: <span className="required">*</span>
          </label>
          <input
            type="text"
            value={formData.client_id || ''}
            onChange={(e) => handleChange('client_id', e.target.value)}
            placeholder="Enter your Client ID"
            required
          />
          <small className="help-text">Sitecore Cloud environment Client ID for automation</small>
        </div>

        <div className="form-group">
          <label>
            Client Secret: <span className="required">*</span>
          </label>
          <input
            type="password"
            value={formData.client_secret || ''}
            onChange={(e) => handleChange('client_secret', e.target.value)}
            placeholder="Enter your Client Secret"
            required
          />
          <small className="help-text">Keep this secret secure. It will be encrypted in storage.</small>
        </div>

        <div className="form-actions">
          <button type="submit" className="btn-primary" disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Settings'}
          </button>
          {!isFirstTimeSetup && (
            <button type="button" className="btn-secondary" onClick={onBack}>
              Cancel
            </button>
          )}
        </div>
      </form>

      <style jsx>{`
        .settings-container {
          padding: 1.5rem;
          max-width: 600px;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
        }

        .settings-header {
          margin-bottom: 1.5rem;
        }

        .back-button {
          background: none;
          border: none;
          color: #6E3FFF;
          cursor: pointer;
          font-size: 0.875rem;
          padding: 0;
          margin-bottom: 1rem;
          display: inline-block;
        }

        .back-button:hover {
          text-decoration: underline;
        }

        h2 {
          font-size: 1.25rem;
          font-weight: 600;
          color: #3B3B3B;
          margin: 0;
        }

        .setup-message {
          margin: 0.75rem 0 0 0;
          color: #717171;
          font-size: 0.875rem;
        }

        .info-box {
          background-color: #F0F7FF;
          border-left: 4px solid #0078D4;
          padding: 1rem;
          margin-bottom: 1.5rem;
          border-radius: 0.375rem;
        }

        .info-box strong {
          display: block;
          color: #0078D4;
          margin-bottom: 0.5rem;
          font-size: 0.875rem;
        }

        .info-box p {
          margin: 0;
          color: #3B3B3B;
          font-size: 0.8125rem;
          line-height: 1.5;
        }

        .error-box {
          background-color: #FFF5F4;
          border: 1px solid #FFE4E2;
          border-radius: 0.375rem;
          padding: 0.75rem;
          margin-bottom: 1.25rem;
        }

        .error-box strong {
          color: #D92739;
          display: block;
          margin-bottom: 0.5rem;
        }

        .error-box ul {
          margin: 0;
          padding-left: 1.25rem;
          color: #D92739;
        }

        .error-box li {
          margin: 0.25rem 0;
        }

        .success-box {
          background-color: #F0FFF4;
          border: 1px solid #C6F6D5;
          border-radius: 0.375rem;
          padding: 0.75rem;
          margin-bottom: 1.25rem;
        }

        .success-box strong {
          color: #22543D;
          display: block;
        }

        .form-group {
          margin-bottom: 1.25rem;
        }

        label {
          display: block;
          font-size: 0.8125rem;
          font-weight: 500;
          color: #3B3B3B;
          margin-bottom: 0.375rem;
        }

        .required {
          color: #D92739;
        }

        input {
          width: 100%;
          padding: 0.5rem 0.75rem;
          border: 1px solid #D8D8D8;
          border-radius: 0.375rem;
          font-size: 0.8125rem;
          font-family: inherit;
          transition: all 0.2s;
        }

        input:focus {
          outline: none;
          border-color: #6E3FFF;
          box-shadow: 0 0 0 3px rgba(110, 63, 255, 0.1);
        }

        .help-text {
          display: block;
          font-size: 0.75rem;
          color: #717171;
          margin-top: 0.25rem;
        }

        .form-section-divider {
          height: 1px;
          background: linear-gradient(to right, transparent, #E9E9E9, transparent);
          margin: 2rem 0 1.5rem 0;
        }

        .form-section-header {
          margin-bottom: 1.25rem;
        }

        .form-section-header h3 {
          font-size: 1rem;
          font-weight: 600;
          color: #3B3B3B;
          margin: 0 0 0.75rem 0;
        }

        .credentials-help {
          background-color: #FFF8E6;
          border-left: 4px solid #FF7D00;
          padding: 0.875rem 1rem;
          border-radius: 0.375rem;
          font-size: 0.8125rem;
          line-height: 1.6;
        }

        .credentials-help p {
          margin: 0 0 0.5rem 0;
          color: #3B3B3B;
        }

        .credentials-help p:last-child {
          margin-bottom: 0;
        }

        .credentials-link {
          color: #6E3FFF;
          font-weight: 500;
          text-decoration: none;
          border-bottom: 1px solid transparent;
          transition: border-color 0.2s;
        }

        .credentials-link:hover {
          border-bottom-color: #6E3FFF;
        }

        .help-note {
          font-size: 0.75rem;
          color: #717171;
          font-style: italic;
        }

        .help-note strong {
          color: #FF7D00;
          font-style: normal;
        }

        input[type="password"] {
          font-family: monospace;
          letter-spacing: 0.05em;
        }

        .form-actions {
          display: flex;
          gap: 0.75rem;
          margin-top: 1.5rem;
        }

        .btn-primary {
          background-color: #6E3FFF;
          color: white;
          border: none;
          padding: 0.625rem 1.5rem;
          border-radius: 9999px;
          cursor: pointer;
          font-size: 0.875rem;
          font-weight: 500;
          transition: all 0.2s;
          box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
        }

        .btn-primary:hover:not(:disabled) {
          background-color: #5319E0;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
          transform: translateY(-1px);
        }

        .btn-primary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .btn-secondary {
          background: #fff;
          color: #717171;
          border: 1px solid #D8D8D8;
          padding: 0.625rem 1.5rem;
          border-radius: 9999px;
          cursor: pointer;
          font-size: 0.875rem;
          font-weight: 500;
          transition: all 0.2s;
        }

        .btn-secondary:hover {
          border-color: #B5B5B5;
          color: #3B3B3B;
          background-color: #F7F7F7;
        }
      `}</style>
    </div>
  );
}

