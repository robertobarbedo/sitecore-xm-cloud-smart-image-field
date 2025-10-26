"use client";

import { useState, useEffect } from 'react';
import { Library, LibraryValidationResult } from '../types/library';
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
    }
  );
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    if (library) {
      setFormData(library);
    }
  }, [library]);

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

    setErrors([]);
    onSave(formData);
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
          <p>Please configure your Main Library. Don&apos;t forget to configure your settings using the Settings button in the top right corner.</p>
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
          padding: 1.5rem;
          max-width: 600px;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
        }

        h2 {
          font-size: 1.25rem;
          font-weight: 600;
          color: #3B3B3B;
          margin: 0 0 1.5rem 0;
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

        input.read-only {
          background-color: #F7F7F7;
          color: #717171;
          cursor: not-allowed;
        }

        .help-text {
          display: block;
          font-size: 0.75rem;
          color: #717171;
          margin-top: 0.25rem;
        }

        .help-text.locked {
          color: #B5B5B5;
          font-style: italic;
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

        .btn-primary:hover {
          background-color: #5319E0;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
          transform: translateY(-1px);
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

