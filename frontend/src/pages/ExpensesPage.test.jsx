import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import { ExpensesPage } from './ExpensesPage.jsx';
import * as api from '../services/api.js';

vi.mock('../services/api.js', () => ({
  getGastos: vi.fn(),
  getGrupos: vi.fn(),
  deleteGasto: vi.fn(),
}));

describe('ExpensesPage component', () => {
  const mockGastos = [
    {
      id: 1,
      descripcion: 'Hospedaje Cabaña Playa',
      monto: '120.00',
      fecha: '2026-10-20',
      grupo_id: 1,
      grupo_nombre: 'Viaje a la Playa',
      pagado_por_nombre: 'Carlos Gómez',
      tipo_reparto: 'IGUALES',
      categoria: 'Hospedaje',
    },
    {
      id: 2,
      descripcion: 'Cena de Mariscos',
      monto: '100.01',
      fecha: '2026-10-21',
      grupo_id: 1,
      grupo_nombre: 'Viaje a la Playa',
      pagado_por_nombre: 'Ana Martínez',
      tipo_reparto: 'IGUALES',
      categoria: 'Comida',
    },
    {
      id: 3,
      descripcion: 'Combustible y Peajes',
      monto: '50.00',
      fecha: '2026-10-19',
      grupo_id: 1,
      grupo_nombre: 'Viaje a la Playa',
      pagado_por_nombre: 'Roberto Silva',
      tipo_reparto: 'PORCENTAJE',
      categoria: 'Transporte',
    },
  ];

  it('filtra gastos por descripción dinámicamente', async () => {
    vi.spyOn(api, 'getGastos').mockResolvedValue(mockGastos);
    vi.spyOn(api, 'getGrupos').mockResolvedValue([{ id: 1, nombre: 'Viaje a la Playa' }]);

    render(
      <BrowserRouter>
        <ExpensesPage />
      </BrowserRouter>
    );

    expect(await screen.findByText('Hospedaje Cabaña Playa')).toBeInTheDocument();
    expect(screen.getByText('Cena de Mariscos')).toBeInTheDocument();
    expect(screen.getByText('Combustible y Peajes')).toBeInTheDocument();

    // Buscar "Mariscos"
    const searchInput = screen.getByPlaceholderText('Buscar...');
    fireEvent.change(searchInput, { target: { value: 'Mariscos' } });

    expect(screen.getByText('Cena de Mariscos')).toBeInTheDocument();
    expect(screen.queryByText('Hospedaje Cabaña Playa')).not.toBeInTheDocument();
    expect(screen.queryByText('Combustible y Peajes')).not.toBeInTheDocument();
  });
});
