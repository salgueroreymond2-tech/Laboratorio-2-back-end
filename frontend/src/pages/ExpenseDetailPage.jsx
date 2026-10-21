import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useFetch } from '../hooks/useFetch.js';
import { getGasto, deleteGasto } from '../services/api.js';
import { formatMoney, toCents, fromCents, sumCents } from '../utils/money.js';
import { formatDate, getInitials } from '../utils/formatters.js';
import { LoadingSpinner } from '../components/common/LoadingSpinner.jsx';
import { ErrorAlert } from '../components/common/ErrorAlert.jsx';
import { ConfirmDialog } from '../components/common/ConfirmDialog.jsx';
import {
  ArrowLeft,
  Edit2,
  Trash2,
  Calendar,
  User,
  Users,
  Tag,
  CheckCircle2,
  AlertTriangle,
  Receipt,
  PieChart,
} from 'lucide-react';

export function ExpenseDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: expense, loading, error, refetch } = useFetch((signal) => getGasto(id, signal), [id]);

  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  const handleDelete = async () => {
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await deleteGasto(id);
      navigate('/gastos');
    } catch (err) {
      setDeleteError(err);
      setIsDeleting(false);
      setShowConfirmDelete(false);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Cargando detalle del gasto..." />;
  }

  if (error) {
    return (
      <ErrorAlert
        error={error}
        onRetry={refetch}
        backLink="/gastos"
        backText="Volver al listado de gastos"
      />
    );
  }

  if (!expense) return null;

  // Cálculo de cuadre y porcentajes visuales
  const totalCents = toCents(expense.monto);
  const participaciones = expense.participaciones || [];
  const assignedCentsArray = participaciones.map((p) => toCents(p.monto_asignado));
  const sumAssignedCents = sumCents(assignedCentsArray);
  const isBalanced = totalCents === sumAssignedCents;

  const splitLabels = {
    IGUALES: 'Equitativo (Partes Iguales)',
    PORCENTAJE: 'Por Porcentaje',
    EXACTO: 'Montos Exactos Asignados',
  };

  return (
    <div>
      {/* Navegación y Acciones Superiores */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <Link
          to="/gastos"
          className="btn btn-secondary btn-sm"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem' }}
        >
          <ArrowLeft size={16} /> Volver a Gastos
        </Link>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Link to={`/gastos/${id}/editar`} className="btn btn-secondary btn-sm">
            <Edit2 size={15} /> Editar Gasto
          </Link>
          <button
            type="button"
            onClick={() => setShowConfirmDelete(true)}
            className="btn btn-outline-danger btn-sm"
          >
            <Trash2 size={15} /> Eliminar
          </button>
        </div>
      </div>

      {deleteError && (
        <ErrorAlert error={deleteError} onRetry={() => setDeleteError(null)} />
      )}

      {/* Tarjeta Principal de Información */}
      <div className="card" style={{ marginBottom: '1.75rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
          <div>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
              <span className="badge badge-info">{splitLabels[expense.tipo_reparto] || expense.tipo_reparto}</span>
              <span className="badge badge-neutral" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                <Tag size={12} /> {expense.categoria || 'General'}
              </span>
            </div>
            <h1 style={{ fontSize: '1.875rem', marginBottom: '0.5rem' }}>{expense.descripcion}</h1>
            <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.9375rem' }}>
              Perteneciente al grupo: <strong>{expense.grupo_nombre}</strong>
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', display: 'block' }}>Monto Total del Gasto</span>
            <span style={{ fontSize: '2.25rem', fontWeight: 800, fontFamily: 'var(--font-heading)', color: 'var(--color-primary)' }}>
              {formatMoney(expense.monto)}
            </span>
          </div>
        </div>

        {/* Metadatos secundarios */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '1rem',
            padding: '1rem',
            borderRadius: 'var(--radius-md)',
            background: 'var(--color-bg-surface)',
            border: '1px solid var(--color-border)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <User size={18} color="var(--color-primary)" />
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'block' }}>Pagado íntegramente por:</span>
              <strong style={{ fontSize: '0.9375rem', color: 'var(--color-text-primary)' }}>{expense.pagado_por_nombre}</strong>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <Calendar size={18} color="var(--color-primary)" />
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'block' }}>Fecha de registro:</span>
              <strong style={{ fontSize: '0.9375rem', color: 'var(--color-text-primary)' }}>{formatDate(expense.fecha)}</strong>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <Users size={18} color="var(--color-primary)" />
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'block' }}>Participantes:</span>
              <strong style={{ fontSize: '0.9375rem', color: 'var(--color-text-primary)' }}>{participaciones.length} personas</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Participaciones Anidadas */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <PieChart size={20} color="var(--color-primary)" />
            <h2 style={{ fontSize: '1.25rem' }}>Desglose de Participaciones</h2>
          </div>

          <div
            className={`badge ${isBalanced ? 'badge-success' : 'badge-danger'}`}
            style={{ fontSize: '0.8125rem' }}
          >
            {isBalanced ? (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                <CheckCircle2 size={14} /> Cuadre financiero verificado ({formatMoney(sumAssignedCents, true)})
              </span>
            ) : (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                <AlertTriangle size={14} /> Descuadre detectado ({formatMoney(sumAssignedCents, true)} vs {formatMoney(totalCents, true)})
              </span>
            )}
          </div>
        </div>

        {participaciones.length === 0 ? (
          <p style={{ color: 'var(--color-text-secondary)', padding: '1rem 0' }}>
            Este gasto no tiene participaciones asociadas registradas.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {participaciones.map((p) => {
              const partCents = toCents(p.monto_asignado);
              const pct = totalCents > 0 ? (partCents / totalCents) * 100 : 0;

              return (
                <div
                  key={p.id || p.persona_id}
                  style={{
                    padding: '1rem',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--color-bg-surface)',
                    border: '1px solid var(--color-border)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div
                        style={{
                          width: '2rem',
                          height: '2rem',
                          borderRadius: '50%',
                          background: 'var(--color-bg-card)',
                          color: 'var(--color-text-primary)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                        }}
                      >
                        {getInitials(p.persona_nombre)}
                      </div>
                      <strong style={{ fontSize: '0.9375rem', color: 'var(--color-text-primary)' }}>
                        {p.persona_nombre}
                      </strong>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <strong style={{ fontSize: '1rem', color: 'var(--color-text-primary)' }}>
                        {formatMoney(p.monto_asignado)}
                      </strong>{' '}
                      <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
                        ({pct.toFixed(2)}%)
                      </span>
                    </div>
                  </div>

                  {/* Barra de progreso visual del porcentaje de participación */}
                  <div
                    style={{
                      height: '6px',
                      borderRadius: 'var(--radius-full)',
                      background: 'rgba(255, 255, 255, 0.08)',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        width: `${Math.min(pct, 100)}%`,
                        height: '100%',
                        borderRadius: 'var(--radius-full)',
                        background: 'linear-gradient(90deg, var(--color-primary) 0%, var(--color-secondary) 100%)',
                        transition: 'width 0.3s ease',
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Confirmación para Eliminar Gasto */}
      <ConfirmDialog
        isOpen={showConfirmDelete}
        title="¿Eliminar este gasto?"
        message={`¿Estás seguro de que deseas eliminar permanentemente el gasto "${expense.descripcion}" por ₡${expense.monto}?`}
        confirmText="Eliminar Gasto"
        cancelText="Cancelar"
        isDanger={true}
        isLoading={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => setShowConfirmDelete(false)}
      />
    </div>
  );
}

export default ExpenseDetailPage;
