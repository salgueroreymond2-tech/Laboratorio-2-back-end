import React from 'react';
import { formatMoney } from '../../utils/money.js';
import { getInitials } from '../../utils/formatters.js';
import { ArrowDownLeft, ArrowUpRight, CheckCircle2, UserMinus } from 'lucide-react';

export function BalanceList({ balances = [], onRemovePerson, removingPersonId = null }) {
  if (!balances.length) {
    return (
      <div style={{ color: 'var(--color-text-secondary)', padding: '1rem 0' }}>
        No hay integrantes con balance registrado en este grupo.
      </div>
    );
  }

  return (
    <div className="table-responsive">
      <table className="data-table" aria-label="Tabla de balances por integrante">
        <thead>
          <tr>
            <th>Integrante</th>
            <th>Pagado</th>
            <th>Consumido</th>
            <th>Liquidado (+ / -)</th>
            <th>Balance Neto</th>
            <th>Estado</th>
            <th style={{ textAlign: 'right' }}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {balances.map((b) => {
            const numBalance = Number(b.balance_neto) || 0;
            const isCreditor = numBalance > 0;
            const isDebtor = numBalance < 0;
            const isSettled = numBalance === 0;

            let badgeClass = 'badge-neutral';
            let statusText = 'Saldado (0.00)';
            let StatusIcon = CheckCircle2;

            if (isCreditor) {
              badgeClass = 'badge-success';
              statusText = 'Acreedor (Debe recibir)';
              StatusIcon = ArrowDownLeft;
            } else if (isDebtor) {
              badgeClass = 'badge-danger';
              statusText = 'Deudor (Debe pagar)';
              StatusIcon = ArrowUpRight;
            }

            return (
              <tr key={b.persona_id}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div
                      style={{
                        width: '2.25rem',
                        height: '2.25rem',
                        borderRadius: '50%',
                        background: 'var(--color-bg-elevated)',
                        color: 'var(--color-text-primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.8125rem',
                        fontWeight: 700,
                      }}
                    >
                      {getInitials(b.nombre)}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{b.nombre}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{b.email}</div>
                    </div>
                  </div>
                </td>
                <td style={{ fontWeight: 500 }}>{formatMoney(b.pagado)}</td>
                <td style={{ color: 'var(--color-text-secondary)' }}>{formatMoney(b.consumido)}</td>
                <td style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
                  +{formatMoney(b.liquidaciones_pagadas)} / -{formatMoney(b.liquidaciones_recibidas)}
                </td>
                <td>
                  <strong
                    style={{
                      fontSize: '1rem',
                      fontFamily: 'var(--font-heading)',
                      color: isCreditor ? 'var(--color-success)' : isDebtor ? 'var(--color-danger)' : 'var(--color-text-muted)',
                    }}
                  >
                    {isCreditor ? `+${formatMoney(b.balance_neto)}` : formatMoney(b.balance_neto)}
                  </strong>
                </td>
                <td>
                  <span className={`badge ${badgeClass}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                    <StatusIcon size={13} />
                    {statusText}
                  </span>
                </td>
                <td style={{ textAlign: 'right' }}>
                  <button
                    type="button"
                    onClick={() => onRemovePerson(b)}
                    disabled={removingPersonId === b.persona_id}
                    className="btn btn-outline-danger btn-sm"
                    title="Retirar integrante (solo permitido si balance es 0.00)"
                    aria-label={`Retirar a ${b.nombre} del grupo`}
                  >
                    <UserMinus size={14} />
                    Retirar
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default BalanceList;
