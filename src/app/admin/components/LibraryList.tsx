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
            padding: 2.5rem;
            text-align: center;
            color: #717171;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
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
            padding: 2.5rem;
            text-align: center;
            color: #717171;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
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
          padding: 1rem;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
        }

        table {
          width: 100%;
          border-collapse: collapse;
          background: white;
          border-radius: 0.5rem;
          overflow: hidden;
          box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
        }

        thead {
          background-color: #F7F7F7;
        }

        th {
          text-align: left;
          padding: 0.75rem 1rem;
          font-size: 0.75rem;
          font-weight: 600;
          color: #717171;
          text-transform: uppercase;
          letter-spacing: 0.03125rem;
        }

        td {
          padding: 0.75rem 1rem;
          font-size: 0.8125rem;
          color: #3B3B3B;
          border-top: 1px solid #E9E9E9;
        }

        tbody tr:hover {
          background-color: #F7F7F7;
        }

        .badge {
          display: inline-block;
          background-color: #6E3FFF;
          color: white;
          font-size: 0.625rem;
          font-weight: 600;
          padding: 0.125rem 0.5rem;
          border-radius: 9999px;
          margin-left: 0.5rem;
          text-transform: uppercase;
          letter-spacing: 0.03125rem;
        }

        .folder-cell {
          max-width: 300px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .key-cell {
          font-family: monospace;
          font-size: 0.6875rem;
          color: #717171;
          max-width: 150px;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .actions-cell {
          display: flex;
          gap: 0.5rem;
        }

        .btn-edit,
        .btn-archive,
        .btn-generate-url {
          background: none;
          border: 1px solid #D8D8D8;
          padding: 0.25rem 0.75rem;
          border-radius: 0.375rem;
          cursor: pointer;
          font-size: 0.75rem;
          font-weight: 500;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }

        .btn-edit {
          color: #6E3FFF;
          border-color: #6E3FFF;
        }

        .btn-edit:hover {
          background-color: #6E3FFF;
          color: white;
        }

        .btn-generate-url {
          background-color: #6E3FFF;
          color: white;
          border-color: #6E3FFF;
          font-weight: 600;
          box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
        }

        .btn-generate-url:hover {
          background-color: #5319E0;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
          transform: translateY(-1px);
        }

        .btn-generate-url .icon {
          font-size: 0.875rem;
        }

        .btn-archive {
          color: #FF7D00;
          border-color: #FF7D00;
        }

        .btn-archive:hover {
          background-color: #FF7D00;
          color: white;
        }
      `}</style>
    </div>
  );
}

