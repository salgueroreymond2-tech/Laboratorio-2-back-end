import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import { ErrorAlert } from './ErrorAlert.jsx';

describe('ErrorAlert component', () => {
  it('renderiza error 409 con badge de Conflicto de negocio', () => {
    const error409 = {
      status: 409,
      message: 'No se puede eliminar la persona porque tiene un saldo pendiente de ₡51.66.',
    };

    render(
      <BrowserRouter>
        <ErrorAlert error={error409} />
      </BrowserRouter>
    );

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Conflicto de negocio (409)')).toBeInTheDocument();
    expect(screen.getByText('409 Conflict')).toBeInTheDocument();
    expect(screen.getByText(/saldo pendiente de ₡51.66/i)).toBeInTheDocument();
  });

  it('ejecuta la función onRetry cuando el usuario hace clic en Reintentar', () => {
    const onRetry = vi.fn();
    const networkError = {
      status: 0,
      message: 'Fallo de conexión al servidor.',
    };

    render(
      <BrowserRouter>
        <ErrorAlert error={networkError} onRetry={onRetry} />
      </BrowserRouter>
    );

    const retryBtn = screen.getByRole('button', { name: /reintentar/i });
    fireEvent.click(retryBtn);
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
