import React from 'react';
import { ExpenseItem } from './ExpenseItem.jsx';
import { EmptyState } from '../common/EmptyState.jsx';
import { Receipt } from 'lucide-react';

export function ExpenseList({ expenses = [], onDelete }) {
  if (!expenses.length) {
    return (
      <EmptyState
        icon={Receipt}
        title="No se encontraron gastos"
        description="No hay gastos registrados que coincidan con los filtros aplicados. Puedes registrar un nuevo gasto para comenzar."
        actionText="Crear nuevo gasto"
        actionLink="/gastos/nuevo"
      />
    );
  }

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
        gap: '1.25rem',
      }}
    >
      {expenses.map((expense) => (
        <ExpenseItem key={expense.id} expense={expense} onDelete={onDelete} />
      ))}
    </div>
  );
}

export default ExpenseList;
