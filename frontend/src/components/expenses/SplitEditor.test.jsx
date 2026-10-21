import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { SplitEditor } from './SplitEditor.jsx';

describe('SplitEditor component', () => {
  const mockMembers = [
    { id: 1, nombre: 'Ana García' },
    { id: 2, nombre: 'Carlos Ruiz' },
  ];

  it('calcula y distribuye partes iguales en reparto IGUALES', () => {
    const handleUpdate = vi.fn();

    render(
      <SplitEditor
        tipoReparto="IGUALES"
        totalAmount="100.01"
        groupMembers={mockMembers}
        selectedParticipants={[1, 2]}
        onChangeParticipants={handleUpdate}
      />
    );

    expect(screen.getByText(/Participantes para reparto equitativo/i)).toBeInTheDocument();
    expect(screen.getByText('Ana García')).toBeInTheDocument();
    expect(screen.getByText('Carlos Ruiz')).toBeInTheDocument();
    expect(screen.getByText(/Sobrante de 1 centavo\(s\)/i)).toBeInTheDocument();

    // Desmarcar a un integrante
    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[1]);

    expect(handleUpdate).toHaveBeenCalledWith([1]);
  });

  it('valida en tiempo real cuando los porcentajes no suman 100% en reparto PORCENTAJE', () => {
    const handleUpdate = vi.fn();

    render(
      <SplitEditor
        tipoReparto="PORCENTAJE"
        totalAmount="100.00"
        groupMembers={mockMembers}
        selectedParticipants={[
          { persona_id: 1, porcentaje: '60.00' },
          { persona_id: 2, porcentaje: '30.00' },
        ]}
        onChangeParticipants={handleUpdate}
      />
    );

    expect(screen.getByText(/Distribución por Porcentaje/i)).toBeInTheDocument();
    // Suma 90%, debe advertir faltante del 10.00%
    expect(screen.getByText(/Falta un 10\.00%/i)).toBeInTheDocument();
  });

  it('valida en tiempo real cuando los montos exactos coinciden con el total en reparto EXACTO', () => {
    const handleUpdate = vi.fn();

    render(
      <SplitEditor
        tipoReparto="EXACTO"
        totalAmount="150.00"
        groupMembers={mockMembers}
        selectedParticipants={[
          { persona_id: 1, monto_asignado: '100.00' },
          { persona_id: 2, monto_asignado: '50.00' },
        ]}
        onChangeParticipants={handleUpdate}
      />
    );

    expect(screen.getByText(/Distribución por Montos Exactos/i)).toBeInTheDocument();
    expect(screen.getByText(/Cuadre exacto/i)).toBeInTheDocument();
  });
});
