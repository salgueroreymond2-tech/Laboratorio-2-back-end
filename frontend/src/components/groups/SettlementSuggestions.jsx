import React, { useState } from 'react';
import { formatMoney } from '../../utils/money.js';
import { ConfirmDialog } from '../common/ConfirmDialog.jsx';
import { ArrowRight, CheckCircle2, DollarSign, Send } from 'lucide-react';

export function SettlementSuggestions({
  suggestions = [],
  totalTransfers = 0,
  onApplySettlement,
  isApplying = false,
}) {
  const [selectedSettlement, setSelectedSettlement] = useState(null);

  const handleOpenConfirm = (suggestion) => {
    setSelectedSettlement(suggestion);
  };

  const handleCloseConfirm = () => {
    if (!isApplying) {
      setSelectedSettlement(null);
    }
  };

  const handleConfirmSubmit = async () => {
    if (!selectedSettlement) return;
    await onApplySettlement(selectedSettlement);
    setSelectedSettlement(null);
  };

  if (!suggestions.length || totalTransfers === 0) {
    return (
      <div
        className="card"
        style={{
          background: 'var(--color-success-bg)',
          border: '1px solid var(--color-success-border)',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          padding: '1.5rem',
        }}
      >
        <div style={{ color: 'var(--color-success)' }}>
          <CheckCircle2 size={32} />
        </div>
        <div>
          <h4 style={{ color: 'var(--color-success)', fontSize: '1.125rem', marginBottom: '0.25rem' }}>
            ¡El grupo está completamente saldado!
          </h4>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
            Todos los integrantes tienen balance en ₡0.00. No se requieren transferencias pendientes.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="card" style={{ background: 'var(--color-bg-card)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <h4 style={{ fontSize: '1.125rem', color: 'var(--color-text-primary)' }}>
              Transferencias Sugeridas (Algoritmo Voraz)
            </h4>
            <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
              Se requieren únicamente <strong>{totalTransfers}</strong> transferencias para saldar todas las deudas del grupo.
            </p>
          </div>
          <span className="badge badge-info">
            {totalTransfers} {totalTransfers === 1 ? 'transferencia' : 'transferencias'}
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {suggestions.map((s, idx) => (
            <div
              key={`${s.de_persona}-${s.a_persona}-${idx}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.875rem 1.25rem',
                borderRadius: 'var(--radius-md)',
                background: 'var(--color-bg-surface)',
                border: '1px solid var(--color-border)',
                flexWrap: 'wrap',
                gap: '1rem',
              }}
            >
              {/* Deudor -> Flecha -> Acreedor */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                <div style={{ textAlign: 'left' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-danger)', fontWeight: 600, display: 'block' }}>
                    Debe pagar:
                  </span>
                  <strong style={{ color: 'var(--color-text-primary)' }}>{s.de_nombre}</strong>
                </div>

                <div
                  style={{
                    color: 'var(--color-text-muted)',
                    background: 'var(--color-bg-card)',
                    padding: '0.375rem',
                    borderRadius: '50%',
                    display: 'flex',
                  }}
                >
                  <ArrowRight size={16} />
                </div>

                <div style={{ textAlign: 'left' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-success)', fontWeight: 600, display: 'block' }}>
                    Debe recibir:
                  </span>
                  <strong style={{ color: 'var(--color-text-primary)' }}>{s.a_nombre}</strong>
                </div>
              </div>

              {/* Monto y Botón de registrar */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'block' }}>
                    Monto sugerido
                  </span>
                  <strong style={{ fontSize: '1.25rem', color: 'var(--color-primary)', fontFamily: 'var(--font-heading)' }}>
                    {formatMoney(s.monto)}
                  </strong>
                </div>

                <button
                  type="button"
                  onClick={() => handleOpenConfirm(s)}
                  disabled={isApplying}
                  className="btn btn-primary btn-sm"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem' }}
                >
                  <Send size={14} /> Registrar liquidación
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Diálogo de Confirmación para Registrar Liquidación */}
      <ConfirmDialog
        isOpen={Boolean(selectedSettlement)}
        title="Confirmar Registro de Liquidación"
        message={
          selectedSettlement
            ? `¿Deseas registrar en el sistema que ${selectedSettlement.de_nombre} transfirió ${formatMoney(selectedSettlement.monto)} a ${selectedSettlement.a_nombre}? Esta acción actualizará los balances del grupo inmediatamente.`
            : ''
        }
        confirmText="Confirmar y Registrar"
        cancelText="Cancelar"
        isLoading={isApplying}
        onConfirm={handleConfirmSubmit}
        onCancel={handleCloseConfirm}
      />
    </>
  );
}

export default SettlementSuggestions;
