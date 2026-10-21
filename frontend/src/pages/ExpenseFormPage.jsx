import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getGrupos, getGasto, createGasto, updateGasto } from '../services/api.js';
import { ExpenseForm } from '../components/expenses/ExpenseForm.jsx';
import { LoadingSpinner } from '../components/common/LoadingSpinner.jsx';
import { ErrorAlert } from '../components/common/ErrorAlert.jsx';
import { Receipt, Edit3, PlusCircle } from 'lucide-react';

export function ExpenseFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [grupos, setGrupos] = useState([]);
  const [initialData, setInitialData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState(null);
  const [serverError, setServerError] = useState(null);

  useEffect(() => {
    let isCancelled = false;

    async function loadData() {
      setLoading(true);
      setPageError(null);
      try {
        const gruposRes = await getGrupos();
        if (isCancelled) return;
        setGrupos(gruposRes || []);

        if (isEdit) {
          const gastoRes = await getGasto(id);
          if (isCancelled) return;
          setInitialData(gastoRes);
        }
      } catch (err) {
        if (!isCancelled) setPageError(err);
      } finally {
        if (!isCancelled) setLoading(false);
      }
    }

    loadData();
    return () => {
      isCancelled = true;
    };
  }, [id, isEdit]);

  const handleSubmit = async (formData) => {
    setServerError(null);
    try {
      if (isEdit) {
        await updateGasto(id, formData);
      } else {
        await createGasto(formData);
      }
      navigate('/gastos');
    } catch (err) {
      console.error('Error al procesar el gasto:', err);
      setServerError(err);
      alert('❌ Error del servidor: ' + (err.message || 'No se pudo guardar el gasto.'));
      throw err;
    }
  };

  if (loading) {
    return <LoadingSpinner message={isEdit ? 'Cargando datos del gasto...' : 'Preparando formulario...'} />;
  }

  if (pageError) {
    return <ErrorAlert error={pageError} backLink="/gastos" backText="Volver al listado" />;
  }

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.375rem' }}>
          {isEdit ? <Edit3 size={28} color="var(--color-primary)" /> : <PlusCircle size={28} color="var(--color-primary)" />}
          {isEdit ? 'Editar Gasto Compartido' : 'Registrar Nuevo Gasto'}
        </h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9375rem' }}>
          {isEdit
            ? 'Modifica los valores y recalcula las participaciones de los integrantes.'
            : 'Completa los datos del gasto y configura el reparto entre los integrantes.'}
        </p>
      </div>

      <ExpenseForm
        initialData={initialData}
        grupos={grupos}
        onSubmit={handleSubmit}
        isEdit={isEdit}
        serverError={serverError}
      />
    </div>
  );
}

export default ExpenseFormPage;
