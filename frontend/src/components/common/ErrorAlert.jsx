import React from 'react';
import { AlertTriangle, RefreshCw, XCircle, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export function ErrorAlert({ error, onRetry, backLink, backText = 'Volver atrás' }) {
  if (!error) return null;

  const status = error.status || 0;
  const message = error.message || 'Ocurrió un error inesperado al procesar la solicitud.';

  let title = 'Error en la operación';
  let badgeText = 'Error';
  let badgeClass = 'badge-danger';

  if (status === 400) {
    title = 'Datos inválidos (400)';
    badgeText = '400 Bad Request';
    badgeClass = 'badge-warning';
  } else if (status === 404) {
    title = 'Recurso no encontrado (404)';
    badgeText = '404 Not Found';
    badgeClass = 'badge-neutral';
  } else if (status === 409) {
    title = 'Conflicto de negocio (409)';
    badgeText = '409 Conflict';
    badgeClass = 'badge-warning';
  } else if (status === 0) {
    title = 'Error de conexión o red';
    badgeText = 'Red';
    badgeClass = 'badge-danger';
  }

  return (
    <div
      role="alert"
      aria-live="assertive"
      style={{
        background: 'var(--color-bg-card)',
        border: '1px solid var(--color-danger-border)',
        borderRadius: 'var(--radius-lg)',
        padding: '1.5rem',
        margin: '1rem 0',
        boxShadow: 'var(--shadow-md)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
        <div
          style={{
            background: 'var(--color-danger-bg)',
            color: 'var(--color-danger)',
            padding: '0.625rem',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          {status === 409 ? <AlertTriangle size={24} /> : <XCircle size={24} />}
        </div>

        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.375rem', flexWrap: 'wrap' }}>
            <h3 style={{ fontSize: '1.125rem', color: 'var(--color-text-primary)' }}>{title}</h3>
            <span className={`badge ${badgeClass}`}>{badgeText}</span>
          </div>

          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9375rem', lineHeight: '1.5' }}>
            {message}
          </p>

          <div style={{ marginTop: '1.25rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="btn btn-secondary btn-sm"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem' }}
              >
                <RefreshCw size={14} />
                Reintentar
              </button>
            )}

            {backLink && (
              <Link
                to={backLink}
                className="btn btn-secondary btn-sm"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem' }}
              >
                <ArrowLeft size={14} />
                {backText}
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ErrorAlert;
