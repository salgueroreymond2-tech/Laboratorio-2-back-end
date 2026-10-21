import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useFetch } from '../hooks/useFetch.js';
import { getGrupos, createGrupo } from '../services/api.js';
import { LoadingSpinner } from '../components/common/LoadingSpinner.jsx';
import { ErrorAlert } from '../components/common/ErrorAlert.jsx';
import { EmptyState } from '../components/common/EmptyState.jsx';
import { StatusMessage } from '../components/common/StatusMessage.jsx';
import { formatDate } from '../utils/formatters.js';
import { validateRequired } from '../utils/validators.js';
import { Users, PlusCircle, ArrowRight, FolderGit2, X, Save } from 'lucide-react';

export function GroupsPage() {
  const { data: grupos = [], loading, error, refetch } = useFetch(getGrupos);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [nombre, setNombre] = useState('');
  const [nameError, setNameError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const handleOpenCreate = () => {
    setNombre('');
    setNameError(null);
    setServerError(null);
    setShowCreateModal(true);
  };

  const handleCloseCreate = () => {
    if (!isSubmitting) setShowCreateModal(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const err = validateRequired(nombre, 'nombre del grupo');
    if (err) {
      setNameError(err);
      return;
    }

    setIsSubmitting(true);
    setServerError(null);

    try {
      const nuevo = await createGrupo({ nombre: nombre.trim() });
      setSuccessMessage(`Grupo "${nuevo.nombre}" creado exitosamente.`);
      setShowCreateModal(false);
      refetch();
    } catch (err) {
      setServerError(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      {/* Cabecera de la página */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', marginBottom: '0.375rem', display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <FolderGit2 size={28} color="var(--color-primary)" />
            Grupos de Gastos
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9375rem' }}>
            Administra los grupos, consulta sus balances financieros y genera liquidaciones sugeridas.
          </p>
        </div>

        <button type="button" onClick={handleOpenCreate} className="btn btn-primary">
          <PlusCircle size={18} /> Crear Nuevo Grupo
        </button>
      </div>

      {successMessage && (
        <StatusMessage
          type="success"
          message={successMessage}
          onClose={() => setSuccessMessage(null)}
        />
      )}

      {loading ? (
        <LoadingSpinner message="Cargando listado de grupos..." />
      ) : error ? (
        <ErrorAlert error={error} onRetry={refetch} />
      ) : !grupos.length ? (
        <EmptyState
          icon={Users}
          title="No hay grupos creados"
          description="Aún no se ha registrado ningún grupo de gastos en el sistema. Crea uno para comenzar a registrar gastos y balances."
          actionText="Crear primer grupo"
          onAction={handleOpenCreate}
        />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
          {grupos.map((g) => (
            <div
              key={g.id}
              className="card"
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <span className="badge badge-neutral" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Users size={12} /> {g.cantidad_integrantes || 0} integrantes
                  </span>
                  {g.creado_en && (
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                      {formatDate(g.creado_en)}
                    </span>
                  )}
                </div>

                <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', color: 'var(--color-text-primary)' }}>
                  {g.nombre}
                </h3>
              </div>

              <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '1rem', marginTop: '1.25rem', display: 'flex', justifyContent: 'flex-end' }}>
                <Link
                  to={`/grupos/${g.id}`}
                  className="btn btn-secondary btn-sm"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem' }}
                >
                  Ver balances e IA <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal para Crear Grupo */}
      {showCreateModal && (
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
            if (e.target === e.currentTarget) handleCloseCreate();
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-group-title"
            style={{
              background: 'var(--color-bg-card)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-lg)',
              maxWidth: '460px',
              width: '100%',
              padding: '1.75rem',
              boxShadow: 'var(--shadow-lg)',
              animation: 'fadeIn 0.2s ease-out',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <h3 id="modal-group-title" style={{ fontSize: '1.25rem' }}>
                Crear Nuevo Grupo
              </h3>
              <button
                type="button"
                onClick={handleCloseCreate}
                disabled={isSubmitting}
                style={{ background: 'transparent', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer' }}
                aria-label="Cerrar modal"
              >
                <X size={20} />
              </button>
            </div>

            {serverError && (
              <div
                role="alert"
                style={{
                  background: 'var(--color-danger-bg)',
                  border: '1px solid var(--color-danger-border)',
                  color: 'var(--color-danger)',
                  padding: '0.75rem',
                  borderRadius: 'var(--radius-md)',
                  marginBottom: '1rem',
                  fontSize: '0.875rem',
                }}
              >
                {serverError.message || 'Error al crear el grupo.'}
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate>
              <div className="form-group">
                <label htmlFor="group-name-input" className="form-label required">
                  Nombre del grupo
                </label>
                <input
                  id="group-name-input"
                  type="text"
                  placeholder="Ej: Viaje a la Playa, Proyecto Departamento..."
                  value={nombre}
                  onChange={(e) => {
                    setNombre(e.target.value);
                    if (nameError) setNameError(null);
                  }}
                  className={`form-input ${nameError ? 'is-invalid' : ''}`}
                  autoFocus
                />
                {nameError && <span className="form-error">{nameError}</span>}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button
                  type="button"
                  onClick={handleCloseCreate}
                  disabled={isSubmitting}
                  className="btn btn-secondary"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn btn-primary"
                >
                  <Save size={16} />
                  {isSubmitting ? 'Creando...' : 'Crear Grupo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default GroupsPage;
