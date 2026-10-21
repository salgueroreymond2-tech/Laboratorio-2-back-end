import React, { useEffect } from 'react';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

export function StatusMessage({
  type = 'success',
  message,
  onClose,
  autoDismissMs = 4000,
}) {
  useEffect(() => {
    if (autoDismissMs && onClose) {
      const timer = setTimeout(() => {
        onClose();
      }, autoDismissMs);
      return () => clearTimeout(timer);
    }
  }, [autoDismissMs, onClose]);

  if (!message) return null;

  const configMap = {
    success: {
      icon: CheckCircle2,
      border: 'var(--color-success-border)',
      bg: 'var(--color-success-bg)',
      color: 'var(--color-success)',
    },
    warning: {
      icon: AlertTriangle,
      border: 'var(--color-warning-border)',
      bg: 'var(--color-warning-bg)',
      color: 'var(--color-warning)',
    },
    info: {
      icon: Info,
      border: 'rgba(59, 130, 246, 0.35)',
      bg: 'var(--color-info-bg)',
      color: 'var(--color-info)',
    },
  };

  const current = configMap[type] || configMap.success;
  const Icon = current.icon;

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0.875rem 1.25rem',
        borderRadius: 'var(--radius-md)',
        background: current.bg,
        border: `1px solid ${current.border}`,
        color: current.color,
        marginBottom: '1rem',
        animation: 'fadeIn 0.2s ease-out',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
        <Icon size={18} />
        <span style={{ fontSize: '0.9375rem', fontWeight: 500, color: 'var(--color-text-primary)' }}>
          {message}
        </span>
      </div>

      {onClose && (
        <button
          type="button"
          onClick={onClose}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'inherit',
            cursor: 'pointer',
            padding: '0.25rem',
            display: 'flex',
          }}
          aria-label="Cerrar notificación"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
}

export default StatusMessage;
