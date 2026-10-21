import React from 'react';

export function LoadingSpinner({ message = 'Cargando información...', size = 'md' }) {
  const sizeMap = {
    sm: { diameter: '1.25rem', border: '2px' },
    md: { diameter: '2.5rem', border: '3px' },
    lg: { diameter: '3.75rem', border: '4px' },
  };

  const { diameter, border } = sizeMap[size] || sizeMap.md;

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2.5rem 1rem',
        gap: '1rem',
        color: 'var(--color-text-secondary)',
      }}
    >
      <div
        style={{
          width: diameter,
          height: diameter,
          borderRadius: '50%',
          border: `${border} solid rgba(99, 102, 241, 0.2)`,
          borderTopColor: 'var(--color-primary)',
          animation: 'spin 0.8s linear infinite',
        }}
      />
      <span style={{ fontSize: '0.9375rem', fontWeight: 500 }}>{message}</span>
    </div>
  );
}
export default LoadingSpinner;
