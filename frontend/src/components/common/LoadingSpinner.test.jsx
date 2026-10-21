import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { LoadingSpinner } from './LoadingSpinner.jsx';

describe('LoadingSpinner component', () => {
  it('renderiza con mensaje predeterminado y rol status accesible', () => {
    render(<LoadingSpinner />);
    const statusEl = screen.getByRole('status');
    expect(statusEl).toBeInTheDocument();
    expect(screen.getByText('Cargando información...')).toBeInTheDocument();
  });

  it('renderiza con mensaje personalizado', () => {
    render(<LoadingSpinner message="Consultando balances en Supabase..." />);
    expect(screen.getByText('Consultando balances en Supabase...')).toBeInTheDocument();
  });
});
