import React from 'react';

export function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color = 'var(--color-primary)',
  trend,
}) {
  return (
    <div
      className="card"
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'relative',
        overflow: 'hidden',
        border: '1px solid var(--color-border)',
        background: 'linear-gradient(145deg, rgba(24, 32, 50, 0.75) 0%, rgba(19, 25, 40, 0.85) 100%)',
        backdropFilter: 'blur(14px)',
        borderRadius: 'var(--radius-lg)',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '3.5px',
          height: '100%',
          backgroundColor: color,
        }}
      />

      <div
        style={{
          position: 'absolute',
          top: '-25px',
          right: '-25px',
          width: '90px',
          height: '90px',
          background: `radial-gradient(circle, ${color}25 0%, transparent 70%)`,
          pointerEvents: 'none',
        }}
      />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
        <span style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-text-secondary)' }}>
          {title}
        </span>
        {Icon && (
          <div
            style={{
              padding: '0.5rem',
              borderRadius: 'var(--radius-md)',
              background: `${color}18`,
              color: color,
              border: `1px solid ${color}30`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon size={20} />
          </div>
        )}
      </div>

      <div>
        <div style={{ fontSize: '1.75rem', fontWeight: 800, fontFamily: 'var(--font-heading)', color: 'var(--color-text-primary)' }}>
          {value !== undefined && value !== null ? value : '-'}
        </div>

        {subtitle && (
          <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
            {subtitle}
          </div>
        )}

        {trend && (
          <div style={{ fontSize: '0.75rem', color: 'var(--color-success)', marginTop: '0.25rem', fontWeight: 600 }}>
            {trend}
          </div>
        )}
      </div>
    </div>
  );
}

export default MetricCard;
