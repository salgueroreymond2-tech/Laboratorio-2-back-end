import React from 'react';
import { Link } from 'react-router-dom';
import { formatDate } from '../../utils/formatters.js';
import { formatMoney } from '../../utils/money.js';
import { Eye, Edit2, Trash2, Calendar, User, Tag } from 'lucide-react';

export function ExpenseItem({ expense, onDelete }) {
  const splitTypeLabels = {
    IGUALES: { label: 'Iguales', badge: 'badge-info' },
    PORCENTAJE: { label: 'Porcentaje', badge: 'badge-warning' },
    EXACTO: { label: 'Exacto', badge: 'badge-success' },
  };

  const splitConfig = splitTypeLabels[expense.tipo_reparto] || {
    label: expense.tipo_reparto,
    badge: 'badge-neutral',
  };

  return (
    <div
      className="card"
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        background: 'var(--color-bg-card)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-sm)',
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.borderColor = 'var(--color-border-hover)';
        e.currentTarget.style.boxShadow = 'var(--shadow-md)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.borderColor = 'var(--color-border)';
        e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
      }}
    >
      <div>
        {/* Cabecera: Badges y Fecha */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
            <span className={`badge ${splitConfig.badge}`}>{splitConfig.label}</span>
            <span className="badge badge-neutral" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
              <Tag size={12} /> {expense.categoria || 'General'}
            </span>
          </div>

          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
            <Calendar size={13} /> {formatDate(expense.fecha)}
          </span>
        </div>

        {/* Título y Grupo */}
        <h3 style={{ fontSize: '1.125rem', marginBottom: '0.375rem', color: 'var(--color-text-primary)' }}>
          {expense.descripcion}
        </h3>

        <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', marginBottom: '0.875rem' }}>
          Grupo: <strong style={{ color: 'var(--color-text-primary)' }}>{expense.grupo_nombre}</strong>
        </div>

        {/* Pagado por */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.8125rem', color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
          <User size={14} color="var(--color-primary)" />
          <span>
            Pagado por: <strong style={{ color: 'var(--color-text-secondary)' }}>{expense.pagado_por_nombre}</strong>
          </span>
        </div>
      </div>

      {/* Pie: Monto y Botones */}
      <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '0.875rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div>
          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'block' }}>Monto total</span>
          <span style={{ fontSize: '1.25rem', fontWeight: 800, fontFamily: 'var(--font-heading)', color: 'var(--color-primary)' }}>
            {formatMoney(expense.monto)}
          </span>
        </div>

        <div style={{ display: 'flex', gap: '0.375rem' }}>
          <Link
            to={`/gastos/${expense.id}`}
            className="btn btn-secondary btn-sm"
            title="Ver participaciones detalladas"
            aria-label={`Ver detalle del gasto ${expense.descripcion}`}
          >
            <Eye size={15} />
          </Link>
          <Link
            to={`/gastos/${expense.id}/editar`}
            className="btn btn-secondary btn-sm"
            title="Editar gasto"
            aria-label={`Editar gasto ${expense.descripcion}`}
          >
            <Edit2 size={15} />
          </Link>
          <button
            type="button"
            onClick={() => onDelete(expense)}
            className="btn btn-outline-danger btn-sm"
            title="Eliminar gasto"
            aria-label={`Eliminar gasto ${expense.descripcion}`}
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default ExpenseItem;
