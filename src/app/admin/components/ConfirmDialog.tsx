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
        return '#d32f2f';
      case 'warning':
        return '#f57c00';
      case 'info':
        return '#1976d2';
      default:
        return '#f57c00';
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
          border-radius: 8px;
          box-shadow: 0 4px 24px rgba(0, 0, 0, 0.2);
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
          padding: 20px 24px;
          border-bottom: 1px solid #e5e5e5;
        }

        .dialog-header h2 {
          margin: 0;
          font-size: 18px;
          font-weight: 600;
          color: #333;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .dialog-header h2::before {
          content: '⚠️';
          font-size: 24px;
        }

        .dialog-content {
          padding: 24px;
        }

        .dialog-content p {
          margin: 0;
          font-size: 14px;
          line-height: 1.6;
          color: #555;
          white-space: pre-line;
        }

        .dialog-actions {
          padding: 16px 24px;
          border-top: 1px solid #e5e5e5;
          display: flex;
          justify-content: flex-end;
          gap: 12px;
        }

        .btn-cancel,
        .btn-confirm {
          padding: 8px 20px;
          border-radius: 4px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          border: none;
        }

        .btn-cancel {
          background: #f5f5f5;
          color: #666;
        }

        .btn-cancel:hover {
          background: #e0e0e0;
          color: #333;
        }

        .btn-confirm {
          background: ${getTypeColor()};
          color: white;
        }

        .btn-confirm:hover {
          opacity: 0.9;
          transform: translateY(-1px);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
        }
      `}</style>
    </div>
  );
}

