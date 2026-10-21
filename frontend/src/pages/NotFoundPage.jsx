import React from 'react';
import { Link } from 'react-router-dom';
import { HelpCircle, Home } from 'lucide-react';

export function NotFoundPage() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '5rem 1.5rem',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          width: '5rem',
          height: '5rem',
          borderRadius: '50%',
          background: 'var(--color-bg-elevated)',
          color: 'var(--color-warning)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '1.5rem',
        }}
      >
        <HelpCircle size={36} />
      </div>

      <h1 style={{ fontSize: '3rem', marginBottom: '0.5rem', color: 'var(--color-text-primary)' }}>
        404
      </h1>
      <h2 style={{ fontSize: '1.5rem', marginBottom: '0.75rem', color: 'var(--color-text-secondary)' }}>
        Página no encontrada
      </h2>
      <p style={{ maxWidth: '420px', color: 'var(--color-text-muted)', marginBottom: '2rem' }}>
        La ruta a la que intentas acceder no existe o fue movida a otra ubicación.
      </p>

      <Link to="/" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
        <Home size={18} /> Volver al Inicio
      </Link>
    </div>
  );
}

export default NotFoundPage;
