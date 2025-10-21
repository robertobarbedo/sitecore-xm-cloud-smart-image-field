"use client";

import { useState, useEffect } from 'react';
import { Library, LibraryValidationResult } from '../types/library';
import { validatePreviewHost, normalizePreviewHost } from '../lib/url-parser';
import { validateFolder } from '../lib/folder-validation';

interface LibraryFormProps {
  library: Library | null;
  onSave: (library: Library) => void;
  onCancel: () => void;
  isMainLibrary?: boolean;
  existingLibraries?: Library[]; // For folder overlap validation
  isFirstTimeSetup?: boolean; // Hide cancel button during first-time setup
}

export function LibraryForm({
  library,
  onSave,
  onCancel,
  isMainLibrary = false,
  existingLibraries = [],
  isFirstTimeSetup = false
}: LibraryFormProps) {
  const [formData, setFormData] = useState<Library>(
    library || {
      key: '',
      name: '',
      folder: '',
      previewHost: '',
      client_id: '',
      client_secret: '',
    }
  );
  const [errors, setErrors] = useState<string[]>([]);
  const [organizationId, setOrganizationId] = useState<string>('');

  useEffect(() => {
    if (library) {
      setFormData(library);
    }
  }, [library]);

  // Get organizationId from URL params for credentials link
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const orgId = params.get('organizationId');
      if (orgId) {
        setOrganizationId(orgId);
      }
    }
  }, []);

  const validateForm = (): LibraryValidationResult => {
    const validationErrors: string[] = [];

    if (!formData.name.trim()) {
      validationErrors.push('Name is required');
    }

    if (!formData.folder.trim()) {
      validationErrors.push('Folder is required');
    } else {
      // Validate folder doesn't overlap with other libraries
      const folderError = validateFolder(
        formData.folder, 
        existingLibraries,
        formData.key // Pass current library key when editing
      );
      if (folderError) {
        validationErrors.push(folderError);
      }
    }

    if (!formData.previewHost.trim()) {
      validationErrors.push('Preview Host is required');
    } else if (!validatePreviewHost(formData.previewHost)) {
      validationErrors.push('Preview Host must be a valid HTTPS URL ending with .sitecorecloud.io');
    }

    return {
      valid: validationErrors.length === 0,
      errors: validationErrors,
    };
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const validation = validateForm();
    if (!validation.valid) {
      setErrors(validation.errors);
      return;
    }

    // Normalize the preview host (ensure trailing slash)
    const normalizedLibrary = {
      ...formData,
      previewHost: normalizePreviewHost(formData.previewHost),
    };

    setErrors([]);
    onSave(normalizedLibrary);
  };

  const handleChange = (field: keyof Library, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <div className="library-form">
      <h2>{library ? 'Edit Library' : 'Create New Library'}</h2>
      
      {isFirstTimeSetup && (
        <div className="info-box">
          <strong>👋 Welcome to Smart Image Field!</strong>
          <p>Please configure your Main Library by entering your Preview Host URL below. You can find this URL in your Sitecore Content Editor address bar.</p>
        </div>
      )}
      
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

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>
            Key: <span className="required">*</span>
          </label>
          <input
            type="text"
            value={formData.key}
            disabled
            className="read-only"
            placeholder="Auto-generated"
          />
        </div>

        <div className="form-group">
          <label>
            Name: <span className="required">*</span>
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            disabled={isMainLibrary}
            className={isMainLibrary ? 'read-only' : ''}
            placeholder="Main Library"
            required
          />
          {isMainLibrary && (
            <small className="help-text locked">Main Library name cannot be changed</small>
          )}
        </div>

        <div className="form-group">
          <label>
            Folder: <span className="required">*</span>
          </label>
          <input
            type="text"
            value={formData.folder}
            onChange={(e) => handleChange('folder', e.target.value)}
            placeholder="/sitecore/media library/Images/Main Library"
            required
          />
          <small className="help-text">Path to the media library folder</small>
        </div>

        <div className="form-group">
          <label>
            Preview Host: <span className="required">*</span>
          </label>
          <input
            type="text"
            value={formData.previewHost}
            onChange={(e) => handleChange('previewHost', e.target.value)}
            placeholder="https://xmc-tenant.sitecorecloud.io/"
            required
          />
          <small className="help-text">Must end with .sitecorecloud.io. This is the value seem in the Content Editor URL. Example: https://xmc-yourtenantname.sitecorecloud.io/</small>
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
                  Click here to create Automation credentials →
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
            Client ID:
          </label>
          <input
            type="text"
            value={formData.client_id || ''}
            onChange={(e) => handleChange('client_id', e.target.value)}
            placeholder=""
          />
          <small className="help-text">Sitecore Cloud environment Client ID for automation</small>
        </div>

        <div className="form-group">
          <label>
            Client Secret:
          </label>
          <input
            type="password"
            value={formData.client_secret || ''}
            onChange={(e) => handleChange('client_secret', e.target.value)}
            placeholder="Enter your Client Secret"
          />
          <small className="help-text">Keep this secret secure. It will be encrypted in storage.</small>
        </div>

        <div className="form-actions">
          <button type="submit" className="btn-primary">
            Save
          </button>
          {!isFirstTimeSetup && (
            <button type="button" className="btn-secondary" onClick={onCancel}>
              Cancel
            </button>
          )}
        </div>
      </form>

      <style jsx>{`
        .library-form {
          padding: 24px;
          max-width: 600px;
        }

        h2 {
          font-size: 20px;
          font-weight: 600;
          color: #333;
          margin: 0 0 24px 0;
        }

        .info-box {
          background-color: #e3f2fd;
          border-left: 4px solid #2196f3;
          padding: 16px;
          margin-bottom: 24px;
          border-radius: 4px;
        }

        .info-box strong {
          display: block;
          color: #1976d2;
          margin-bottom: 8px;
          font-size: 14px;
        }

        .info-box p {
          margin: 0;
          color: #555;
          font-size: 13px;
          line-height: 1.5;
        }

        .error-box {
          background-color: #fee;
          border: 1px solid #fcc;
          border-radius: 4px;
          padding: 12px;
          margin-bottom: 20px;
        }

        .error-box strong {
          color: #c33;
          display: block;
          margin-bottom: 8px;
        }

        .error-box ul {
          margin: 0;
          padding-left: 20px;
          color: #c33;
        }

        .error-box li {
          margin: 4px 0;
        }

        .form-group {
          margin-bottom: 20px;
        }

        label {
          display: block;
          font-size: 13px;
          font-weight: 500;
          color: #333;
          margin-bottom: 6px;
        }

        .required {
          color: #d32f2f;
        }

        input {
          width: 100%;
          padding: 8px 12px;
          border: 1px solid #d0d0d0;
          border-radius: 4px;
          font-size: 13px;
          font-family: inherit;
          transition: border-color 0.2s;
        }

        input:focus {
          outline: none;
          border-color: #7C3AED;
        }

        input.read-only {
          background-color: #f5f5f5;
          color: #666;
          cursor: not-allowed;
        }

        .help-text {
          display: block;
          font-size: 12px;
          color: #666;
          margin-top: 4px;
        }

        .help-text.locked {
          color: #999;
          font-style: italic;
        }

        .form-section-divider {
          height: 1px;
          background: linear-gradient(to right, transparent, #e0e0e0, transparent);
          margin: 32px 0 24px 0;
        }

        .form-section-header {
          margin-bottom: 20px;
        }

        .form-section-header h3 {
          font-size: 16px;
          font-weight: 600;
          color: #333;
          margin: 0 0 12px 0;
        }

        .credentials-help {
          background-color: #fff3e0;
          border-left: 4px solid #ff9800;
          padding: 14px 16px;
          border-radius: 4px;
          font-size: 13px;
          line-height: 1.6;
        }

        .credentials-help p {
          margin: 0 0 8px 0;
          color: #555;
        }

        .credentials-help p:last-child {
          margin-bottom: 0;
        }

        .credentials-link {
          color: #7C3AED;
          font-weight: 500;
          text-decoration: none;
          border-bottom: 1px solid transparent;
          transition: border-color 0.2s;
        }

        .credentials-link:hover {
          border-bottom-color: #7C3AED;
        }

        .help-note {
          font-size: 12px;
          color: #666;
          font-style: italic;
        }

        .help-note strong {
          color: #ff9800;
          font-style: normal;
        }

        input[type="password"] {
          font-family: monospace;
          letter-spacing: 0.05em;
        }

        .form-actions {
          display: flex;
          gap: 12px;
          margin-top: 24px;
        }

        .btn-primary {
          background: linear-gradient(135deg, #7C3AED 0%, #6366F1 100%);
          color: white;
          border: none;
          padding: 10px 24px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          transition: all 0.2s;
        }

        .btn-primary:hover {
          background: linear-gradient(135deg, #6D28D9 0%, #4F46E5 100%);
          transform: translateY(-1px);
        }

        .btn-secondary {
          background: #fff;
          color: #666;
          border: 1px solid #d0d0d0;
          padding: 10px 24px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          transition: all 0.2s;
        }

        .btn-secondary:hover {
          border-color: #999;
          color: #333;
        }
      `}</style>
    </div>
  );
}

