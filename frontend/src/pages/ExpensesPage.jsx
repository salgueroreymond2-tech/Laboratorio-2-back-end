import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useFetch } from '../hooks/useFetch.js';
import { getGastos, getGrupos, deleteGasto } from '../services/api.js';
import { ExpenseFilters } from '../components/expenses/ExpenseFilters.jsx';
import { ExpenseList } from '../components/expenses/ExpenseList.jsx';
import { LoadingSpinner } from '../components/common/LoadingSpinner.jsx';
import { ErrorAlert } from '../components/common/ErrorAlert.jsx';
import { ConfirmDialog } from '../components/common/ConfirmDialog.jsx';
import { StatusMessage } from '../components/common/StatusMessage.jsx';
import { PlusCircle, Receipt } from 'lucide-react';

export function ExpensesPage() {
  const { data: gastos = [], loading: loadingGastos, error: errorGastos, refetch: refetchGastos } = useFetch(getGastos);
  const { data: grupos = [] } = useFetch(getGrupos);

  // Estados de filtros y ordenamiento
  const [filters, setFilters] = useState({
    search: '',
    grupo_id: '',
    categoria: '',
    tipo_reparto: '',
    orderBy: 'fecha-desc',
  });

  // Estado para eliminar gasto
  const [expenseToDelete, setExpenseToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleResetFilters = () => {
    setFilters({
      search: '',
      grupo_id: '',
      categoria: '',
      tipo_reparto: '',
      orderBy: 'fecha-desc',
    });
  };

  // Filtrado y ordenamiento reactivo en el cliente sin mutar el array original
  const filteredAndSortedExpenses = useMemo(() => {
    if (!Array.isArray(gastos)) return [];

    let result = [...gastos];

    // 1. Filtro por búsqueda de texto
    if (filters.search.trim()) {
      const q = filters.search.toLowerCase().trim();
      result = result.filter((g) => (g.descripcion || '').toLowerCase().includes(q));
    }

    // 2. Filtro por grupo
    if (filters.grupo_id) {
      result = result.filter((g) => String(g.grupo_id) === String(filters.grupo_id));
    }

    // 3. Filtro por categoría
    if (filters.categoria) {
      result = result.filter((g) => (g.categoria || '').toLowerCase() === filters.categoria.toLowerCase());
    }

    // 4. Filtro por tipo de reparto
    if (filters.tipo_reparto) {
      result = result.filter((g) => g.tipo_reparto === filters.tipo_reparto);
    }

    // 5. Ordenamiento inmutable
    result.sort((a, b) => {
      switch (filters.orderBy) {
        case 'fecha-asc':
          return new Date(a.fecha).getTime() - new Date(b.fecha).getTime();
        case 'monto-desc':
          return (Number(b.monto) || 0) - (Number(a.monto) || 0);
        case 'monto-asc':
          return (Number(a.monto) || 0) - (Number(b.monto) || 0);
        case 'desc-asc':
          return (a.descripcion || '').localeCompare(b.descripcion || '');
        case 'desc-desc':
          return (b.descripcion || '').localeCompare(a.descripcion || '');
        case 'fecha-desc':
        default:
          return new Date(b.fecha).getTime() - new Date(a.fecha).getTime();
      }
    });

    return result;
  }, [gastos, filters]);

  // Confirmar eliminación
  const handleConfirmDelete = async () => {
    if (!expenseToDelete) return;
    setIsDeleting(true);
    setDeleteError(null);

    try {
      await deleteGasto(expenseToDelete.id);
      setSuccessMessage(`Gasto "${expenseToDelete.descripcion}" eliminado correctamente.`);
      setExpenseToDelete(null);
      refetchGastos();
    } catch (err) {
      setDeleteError(err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div>
      {/* Cabecera de la página */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', marginBottom: '0.375rem', display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <Receipt size={28} color="var(--color-primary)" />
            Gastos Compartidos
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9375rem' }}>
            Administra, filtra y revisa las participaciones de los gastos del sistema.
          </p>
        </div>

        <Link to="/gastos/nuevo" className="btn btn-primary">
          <PlusCircle size={18} /> Registrar Nuevo Gasto
        </Link>
      </div>

      {/* Notificación de éxito */}
      {successMessage && (
        <StatusMessage
          type="success"
          message={successMessage}
          onClose={() => setSuccessMessage(null)}
        />
      )}

      {/* Error al eliminar */}
      {deleteError && (
        <ErrorAlert error={deleteError} onRetry={() => setDeleteError(null)} />
      )}

      {/* Componente de Filtros y Ordenamiento */}
      <ExpenseFilters
        filters={filters}
        onChangeFilter={handleFilterChange}
        onResetFilters={handleResetFilters}
        grupos={grupos}
        totalCount={gastos?.length || 0}
        filteredCount={filteredAndSortedExpenses?.length || 0}
      />

      {/* Lista de Gastos */}
      {loadingGastos ? (
        <LoadingSpinner message="Cargando listado de gastos..." />
      ) : errorGastos ? (
        <ErrorAlert error={errorGastos} onRetry={refetchGastos} />
      ) : (
        <ExpenseList
          expenses={filteredAndSortedExpenses}
          onDelete={(exp) => setExpenseToDelete(exp)}
        />
      )}

      {/* Modal de Confirmación de Eliminación */}
      <ConfirmDialog
        isOpen={Boolean(expenseToDelete)}
        title="¿Eliminar gasto compartido?"
        message={
          expenseToDelete
            ? `¿Estás seguro de que deseas eliminar el gasto "${expenseToDelete.descripcion}" por ₡${expenseToDelete.monto}? Esta acción también eliminará todas sus participaciones asignadas.`
            : ''
        }
        confirmText="Eliminar Gasto"
        cancelText="Cancelar"
        isDanger={true}
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setExpenseToDelete(null)}
      />
    </div>
  );
}

export default ExpensesPage;
