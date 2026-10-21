import React, { useEffect, useRef } from 'react';
import { AlertCircle, X } from 'lucide-react';

export function ConfirmDialog({
  isOpen,
  title = '¿Confirmar acción?',
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  isDanger = false,
  isLoading = false,
  onConfirm,
  onCancel,
}) {
  const dialogRef = useRef(null);

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape' && isOpen && !isLoading) {
        onCancel();
      }
    }
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, isLoading, onCancel]);

  if (!isOpen) return null;

  return (
    <div
      role="presentation"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 50,
        padding: '1rem',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !isLoading) {
          onCancel();
        }
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        style={{
          background: 'var(--color-bg-card)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-lg)',
          maxWidth: '480px',
          width: '100%',
          padding: '1.75rem',
          boxShadow: 'var(--shadow-lg)',
          animation: 'fadeIn 0.2s ease-out',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <div
              style={{
                background: isDanger ? 'var(--color-danger-bg)' : 'var(--color-primary-light)',
                color: isDanger ? 'var(--color-danger)' : 'var(--color-primary)',
                padding: '0.5rem',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
              }}
            >
              <AlertCircle size={20} />
            </div>
            <h3 id="confirm-dialog-title" style={{ fontSize: '1.25rem' }}>
              {title}
            </h3>
          </div>

          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--color-text-muted)',
              cursor: 'pointer',
              padding: '0.25rem',
              borderRadius: 'var(--radius-sm)',
            }}
            aria-label="Cerrar diálogo"
          >
            <X size={20} />
          </button>
        </div>

        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9375rem', lineHeight: '1.6', marginBottom: '1.75rem' }}>
          {message}
        </p>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="btn btn-secondary"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`btn ${isDanger ? 'btn-danger' : 'btn-primary'}`}
          >
            {isLoading ? 'Procesando...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmDialog;
