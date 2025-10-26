"use client";

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  type?: 'warning' | 'danger' | 'info';
}

export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  type = 'warning',
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  const getTypeColor = () => {
    switch (type) {
      case 'danger':
        return '#D92739';
      case 'warning':
        return '#FF7D00';
      case 'info':
        return '#0078D4';
      default:
        return '#FF7D00';
    }
  };

  return (
    <div className="dialog-overlay" onClick={onCancel}>
      <div className="dialog-container" onClick={(e) => e.stopPropagation()}>
        <div className="dialog-header">
          <h2>{title}</h2>
        </div>
        <div className="dialog-content">
          <p>{message}</p>
        </div>
        <div className="dialog-actions">
          <button className="btn-cancel" onClick={onCancel}>
            {cancelText}
          </button>
          <button className="btn-confirm" onClick={onConfirm}>
            {confirmText}
          </button>
        </div>
      </div>

      <style jsx>{`
        .dialog-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          animation: fadeIn 0.2s ease-out;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        .dialog-container {
          background: white;
          border-radius: 0.5rem;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
          max-width: 500px;
          width: 90%;
          animation: slideIn 0.2s ease-out;
        }

        @keyframes slideIn {
          from {
            transform: translateY(-20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        .dialog-header {
          padding: 1.25rem 1.5rem;
          border-bottom: 1px solid #E9E9E9;
        }

        .dialog-header h2 {
          margin: 0;
          font-size: 1.125rem;
          font-weight: 600;
          color: #3B3B3B;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .dialog-header h2::before {
          content: '⚠️';
          font-size: 1.5rem;
        }

        .dialog-content {
          padding: 1.5rem;
        }

        .dialog-content p {
          margin: 0;
          font-size: 0.875rem;
          line-height: 1.6;
          color: #3B3B3B;
          white-space: pre-line;
        }

        .dialog-actions {
          padding: 1rem 1.5rem;
          border-top: 1px solid #E9E9E9;
          display: flex;
          justify-content: flex-end;
          gap: 0.75rem;
        }

        .btn-cancel,
        .btn-confirm {
          padding: 0.5rem 1.25rem;
          border-radius: 9999px;
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          border: none;
        }

        .btn-cancel {
          background: #F7F7F7;
          color: #717171;
          border: 1px solid #D8D8D8;
        }

        .btn-cancel:hover {
          background: #E9E9E9;
          color: #3B3B3B;
        }

        .btn-confirm {
          background: ${getTypeColor()};
          color: white;
          box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
        }

        .btn-confirm:hover {
          opacity: 0.9;
          transform: translateY(-1px);
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        }
      `}</style>
    </div>
  );
}

