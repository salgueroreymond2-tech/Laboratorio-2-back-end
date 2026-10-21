import React, { useState } from 'react';
import { useFetch } from '../hooks/useFetch.js';
import { getPersonas, createPersona, updatePersona, deletePersona } from '../services/api.js';
import { PeopleList } from '../components/people/PeopleList.jsx';
import { PersonForm } from '../components/people/PersonForm.jsx';
import { LoadingSpinner } from '../components/common/LoadingSpinner.jsx';
import { ErrorAlert } from '../components/common/ErrorAlert.jsx';
import { ConfirmDialog } from '../components/common/ConfirmDialog.jsx';
import { StatusMessage } from '../components/common/StatusMessage.jsx';
import { User, PlusCircle, X } from 'lucide-react';

export function PeoplePage() {
  const { data: people = [], loading, error, refetch } = useFetch(getPersonas);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingPerson, setEditingPerson] = useState(null);
  const [formServerError, setFormServerError] = useState(null);
  const [isFormSubmitting, setIsFormSubmitting] = useState(false);

  const [personToDelete, setPersonToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const handleOpenCreate = () => {
    setEditingPerson(null);
    setFormServerError(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (person) => {
    setEditingPerson(person);
    setFormServerError(null);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    if (!isFormSubmitting) {
      setModalOpen(false);
      setEditingPerson(null);
      setFormServerError(null);
    }
  };

  const handleFormSubmit = async (formData) => {
    setIsFormSubmitting(true);
    setFormServerError(null);

    try {
      if (editingPerson) {
        await updatePersona(editingPerson.id, formData);
        setSuccessMessage(`Persona "${formData.nombre}" actualizada con éxito.`);
      } else {
        await createPersona(formData);
        setSuccessMessage(`Persona "${formData.nombre}" registrada con éxito.`);
      }
      setModalOpen(false);
      refetch();
    } catch (err) {
      setFormServerError(err);
    } finally {
      setIsFormSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!personToDelete) return;

    setIsDeleting(true);
    setDeleteError(null);

    try {
      await deletePersona(personToDelete.id);
      setSuccessMessage(`Persona "${personToDelete.nombre}" eliminada exitosamente.`);
      setPersonToDelete(null);
      refetch();
    } catch (err) {
      setDeleteError(err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div>
      {/* Cabecera */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', marginBottom: '0.375rem', display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <User size={28} color="var(--color-primary)" />
            Administración de Personas
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9375rem' }}>
            Registra y gestiona los integrantes que participan en los grupos y gastos compartidos.
          </p>
        </div>

        <button type="button" onClick={handleOpenCreate} className="btn btn-primary">
          <PlusCircle size={18} /> Registrar Persona
        </button>
      </div>

      {successMessage && (
        <StatusMessage
          type="success"
          message={successMessage}
          onClose={() => setSuccessMessage(null)}
        />
      )}

      {deleteError && (
        <ErrorAlert error={deleteError} onRetry={() => setDeleteError(null)} />
      )}

      {loading ? (
        <LoadingSpinner message="Cargando listado de personas..." />
      ) : error ? (
        <ErrorAlert error={error} onRetry={refetch} />
      ) : (
        <PeopleList
          people={people}
          onEdit={handleOpenEdit}
          onDelete={(person) => setPersonToDelete(person)}
          deletingId={isDeleting ? personToDelete?.id : null}
        />
      )}

      {/* Modal para Crear o Editar Persona */}
      {modalOpen && (
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
            if (e.target === e.currentTarget && !isFormSubmitting) handleCloseModal();
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-person-title"
            style={{
              background: 'var(--color-bg-card)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-lg)',
              maxWidth: '460px',
              width: '100%',
              padding: '1.75rem',
              boxShadow: 'var(--shadow-lg)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 id="modal-person-title" style={{ fontSize: '1.25rem' }}>
                {editingPerson ? 'Editar Persona' : 'Registrar Nueva Persona'}
              </h3>
              <button
                type="button"
                onClick={handleCloseModal}
                disabled={isFormSubmitting}
                style={{ background: 'transparent', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer' }}
                aria-label="Cerrar modal"
              >
                <X size={20} />
              </button>
            </div>

            <PersonForm
              initialData={editingPerson}
              onSubmit={handleFormSubmit}
              onCancel={handleCloseModal}
              isSubmitting={isFormSubmitting}
              serverError={formServerError}
            />
          </div>
        </div>
      )}

      {/* Confirmación para Eliminar Persona con advertencia de Integridad Referencial */}
      <ConfirmDialog
        isOpen={Boolean(personToDelete)}
        title="¿Eliminar persona del sistema?"
        message={
          personToDelete
            ? `¿Deseas eliminar a "${personToDelete.nombre}"? Si la persona pertenece a grupos o tiene gastos, participaciones o liquidaciones asociadas, la base de datos rechazará la eliminación con error 409 para proteger la integridad histórica.`
            : ''
        }
        confirmText="Intentar Eliminar"
        cancelText="Cancelar"
        isDanger={true}
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setPersonToDelete(null)}
      />
    </div>
  );
}

export default PeoplePage;
