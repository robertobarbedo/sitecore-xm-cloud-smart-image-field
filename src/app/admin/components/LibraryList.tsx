"use client";

import { Library } from '../types/library';

interface LibraryListProps {
  libraries: Library[];
  onEdit: (library: Library) => void;
  onArchive: (library: Library) => void;
  onGenerateUrl: (library: Library) => void;
  isLoading?: boolean;
}

export function LibraryList({ libraries, onEdit, onArchive, onGenerateUrl, isLoading = false }: LibraryListProps) {
  if (isLoading) {
    return (
      <div className="library-list loading">
        <p>Loading libraries...</p>
        <style jsx>{`
          .library-list.loading {
            padding: 40px;
            text-align: center;
            color: #666;
          }
        `}</style>
      </div>
    );
  }

  if (libraries.length === 0) {
    return (
      <div className="library-list empty">
        <p>No libraries found. Creating Main Library...</p>
        <style jsx>{`
          .library-list.empty {
            padding: 40px;
            text-align: center;
            color: #666;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="library-list">
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Folder</th>
            <th>Preview Host</th>
            <th>Key</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {libraries.map((library) => {
            const isMainLibrary = library.name === 'Main Library';
            
            return (
              <tr key={library.key}>
                <td>
                  <strong>{library.name}</strong>
                  {isMainLibrary && <span className="badge">Main</span>}
                </td>
                <td className="folder-cell">{library.folder}</td>
                <td className="host-cell">{library.previewHost}</td>
                <td className="key-cell">{library.key}</td>
                <td>
                  <div className="actions-cell">
                    <button
                      className="btn-edit"
                      onClick={() => onEdit(library)}
                      title="Edit library"
                    >
                      Edit
                    </button>
                    <button
                      className="btn-generate-url"
                      onClick={() => onGenerateUrl(library)}
                      title="Generate Field URL"
                    >
                      <span className="icon">🔗</span>
                      New Field URL
                    </button>
                    {!isMainLibrary && (
                      <button
                        className="btn-archive"
                        onClick={() => onArchive(library)}
                        title="Archive library (cannot be undone)"
                      >
                        Archive
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <style jsx>{`
        .library-list {
          padding: 16px;
        }

        table {
          width: 100%;
          border-collapse: collapse;
          background: white;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        thead {
          background-color: #f8f9fa;
        }

        th {
          text-align: left;
          padding: 12px 16px;
          font-size: 12px;
          font-weight: 600;
          color: #666;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        td {
          padding: 12px 16px;
          font-size: 13px;
          color: #333;
          border-top: 1px solid #e5e5e5;
        }

        tbody tr:hover {
          background-color: #fafafa;
        }

        .badge {
          display: inline-block;
          background: linear-gradient(135deg, #7C3AED 0%, #6366F1 100%);
          color: white;
          font-size: 10px;
          font-weight: 600;
          padding: 2px 8px;
          border-radius: 10px;
          margin-left: 8px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .folder-cell,
        .host-cell {
          max-width: 200px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .key-cell {
          font-family: monospace;
          font-size: 11px;
          color: #666;
          max-width: 150px;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .actions-cell {
          display: flex;
          gap: 8px;
        }

        .btn-edit,
        .btn-archive,
        .btn-generate-url {
          background: none;
          border: 1px solid #d0d0d0;
          padding: 4px 12px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
          font-weight: 500;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .btn-edit {
          color: #7C3AED;
          border-color: #7C3AED;
        }

        .btn-edit:hover {
          background-color: #7C3AED;
          color: white;
        }

        .btn-generate-url {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border-color: #667eea;
          font-weight: 600;
          box-shadow: 0 2px 4px rgba(102, 126, 234, 0.3);
        }

        .btn-generate-url:hover {
          background: linear-gradient(135deg, #764ba2 0%, #667eea 100%);
          box-shadow: 0 4px 8px rgba(102, 126, 234, 0.5);
          transform: translateY(-1px);
        }

        .btn-generate-url .icon {
          font-size: 14px;
        }

        .btn-archive {
          color: #f57c00;
          border-color: #f57c00;
        }

        .btn-archive:hover {
          background-color: #f57c00;
          color: white;
        }
      `}</style>
    </div>
  );
}

