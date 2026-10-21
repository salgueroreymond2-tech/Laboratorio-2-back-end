import React from 'react';
import { FolderOpen } from 'lucide-react';
import { Link } from 'react-router-dom';

export function EmptyState({
  title = 'No hay registros disponibles',
  description = 'No se encontraron elementos para mostrar con los criterios actuales.',
  icon: Icon = FolderOpen,
  actionText,
  actionLink,
  onAction,
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '3.5rem 1.5rem',
        textAlign: 'center',
        background: 'var(--color-bg-card)',
        border: '1px dashed var(--color-border)',
        borderRadius: 'var(--radius-lg)',
        margin: '1rem 0',
      }}
    >
      <div
        style={{
          width: '4rem',
          height: '4rem',
          borderRadius: '50%',
          background: 'var(--color-bg-elevated)',
          color: 'var(--color-text-secondary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '1rem',
        }}
      >
        <Icon size={28} />
      </div>

      <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', color: 'var(--color-text-primary)' }}>
        {title}
      </h3>
      <p style={{ color: 'var(--color-text-secondary)', maxWidth: '420px', fontSize: '0.9375rem', marginBottom: '1.5rem' }}>
        {description}
      </p>

      {actionText && actionLink && (
        <Link to={actionLink} className="btn btn-primary">
          {actionText}
        </Link>
      )}

      {actionText && onAction && !actionLink && (
        <button type="button" onClick={onAction} className="btn btn-primary">
          {actionText}
        </button>
      )}
    </div>
  );
}

export default EmptyState;
