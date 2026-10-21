import React from 'react';
import { getInitials, formatDate } from '../../utils/formatters.js';
import { EmptyState } from '../common/EmptyState.jsx';
import { Users, Edit2, Trash2, Calendar, Mail } from 'lucide-react';

export function PeopleList({
  people = [],
  onEdit,
  onDelete,
  deletingId = null,
}) {
  if (!people.length) {
    return (
      <EmptyState
        icon={Users}
        title="No hay personas registradas"
        description="Aún no se ha registrado ninguna persona en el sistema. Puedes agregar la primera para comenzar."
        actionText="Registrar persona"
        onAction={() => onEdit(null)}
      />
    );
  }

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        gap: '1rem',
      }}
    >
      {people.map((person) => (
        <div
          key={person.id}
          className="card"
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.875rem' }}>
            <div
              style={{
                width: '2.75rem',
                height: '2.75rem',
                borderRadius: '50%',
                background: 'var(--color-bg-elevated)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1rem',
                fontWeight: 700,
                flexShrink: 0,
              }}
            >
              {getInitials(person.nombre)}
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <h4 style={{ fontSize: '1rem', color: 'var(--color-text-primary)', marginBottom: '0.25rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {person.nombre}
              </h4>
              <div
                style={{
                  fontSize: '0.8125rem',
                  color: 'var(--color-text-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.375rem',
                  marginBottom: '0.375rem',
                }}
              >
                <Mail size={13} color="var(--color-text-muted)" />
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {person.email}
                </span>
              </div>
              {person.creado_en && (
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <Calendar size={12} />
                  <span>Registrado: {formatDate(person.creado_en)}</span>
                </div>
              )}
            </div>
          </div>

          <div
            style={{
              borderTop: '1px solid var(--color-border)',
              marginTop: '1rem',
              paddingTop: '0.75rem',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '0.5rem',
            }}
          >
            <button
              type="button"
              onClick={() => onEdit(person)}
              className="btn btn-secondary btn-sm"
              title="Editar persona"
              aria-label={`Editar persona ${person.nombre}`}
            >
              <Edit2 size={14} /> Editar
            </button>
            <button
              type="button"
              onClick={() => onDelete(person)}
              disabled={deletingId === person.id}
              className="btn btn-outline-danger btn-sm"
              title="Eliminar persona"
              aria-label={`Eliminar persona ${person.nombre}`}
            >
              <Trash2 size={14} /> Eliminar
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

export default PeopleList;
