import React from 'react';
import { toCents, fromCents, formatMoney } from '../../utils/money.js';
import { validatePercentageSum, validateExactSum } from '../../utils/validators.js';
import { Users, Percent, Calculator, CheckCircle2, AlertCircle } from 'lucide-react';

export function SplitEditor({
  tipoReparto,
  totalAmount,
  groupMembers = [],
  selectedParticipants = [],
  onChangeParticipants,
}) {
  const totalCents = (() => {
    try {
      return toCents(totalAmount);
    } catch {
      return 0;
    }
  })();

  /* ==========================================================================
     1. MODO: REPARTO IGUALES
     ========================================================================== */
  if (tipoReparto === 'IGUALES') {
    const participantIds = selectedParticipants.map((p) => (typeof p === 'object' ? p.persona_id : p));
    const sortedIds = [...participantIds].sort((a, b) => a - b);
    const count = sortedIds.length;
    const baseCents = count > 0 ? Math.floor(totalCents / count) : 0;
    const remainderCents = count > 0 ? totalCents % count : 0;

    const toggleParticipant = (memberId) => {
      let next;
      if (participantIds.includes(memberId)) {
        next = participantIds.filter((id) => id !== memberId);
      } else {
        next = [...participantIds, memberId];
      }
      onChangeParticipants(next);
    };

    const selectAll = () => {
      onChangeParticipants(groupMembers.map((m) => m.id));
    };

    const clearAll = () => {
      onChangeParticipants([]);
    };

    return (
      <div className="card" style={{ background: 'var(--color-bg-surface)', marginTop: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Users size={18} color="var(--color-primary)" />
            <span style={{ fontWeight: 600, fontSize: '0.9375rem' }}>
              Participantes para reparto equitativo ({count} seleccionados)
            </span>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button type="button" onClick={selectAll} className="btn btn-secondary btn-sm">
              Seleccionar todos
            </button>
            <button type="button" onClick={clearAll} className="btn btn-secondary btn-sm">
              Limpiar
            </button>
          </div>
        </div>

        {count === 0 ? (
          <div style={{ color: 'var(--color-danger)', fontSize: '0.875rem', padding: '0.5rem 0' }}>
            Selecciona al menos un integrante para distribuir el gasto.
          </div>
        ) : (
          <div style={{ background: 'var(--color-bg-card)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', marginBottom: '1rem', border: '1px solid var(--color-border)' }}>
            <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', display: 'flex', justifyContent: 'space-between' }}>
              <span>Cuota base por persona:</span>
              <strong style={{ color: 'var(--color-text-primary)' }}>{formatMoney(baseCents, true)}</strong>
            </div>
            {remainderCents > 0 && (
              <div style={{ fontSize: '0.8125rem', color: 'var(--color-warning)', marginTop: '0.375rem' }}>
                💡 Sobrante de {remainderCents} centavo(s) distribuido a los primeros {remainderCents} integrantes por orden de ID.
              </div>
            )}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '0.75rem' }}>
          {groupMembers.map((member) => {
            const isSelected = participantIds.includes(member.id);
            const index = sortedIds.indexOf(member.id);
            const getsExtra = isSelected && index >= 0 && index < remainderCents;
            const assignedCents = isSelected ? baseCents + (getsExtra ? 1 : 0) : 0;

            return (
              <label
                key={member.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.625rem 0.875rem',
                  borderRadius: 'var(--radius-md)',
                  background: isSelected ? 'var(--color-primary-light)' : 'var(--color-bg-card)',
                  border: `1px solid ${isSelected ? 'var(--color-border-focus)' : 'var(--color-border)'}`,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggleParticipant(member.id)}
                  style={{ width: '1.125rem', height: '1.125rem', accentColor: 'var(--color-primary)' }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 500, fontSize: '0.875rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {member.nombre}
                  </div>
                  {isSelected && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                      Asignado: {formatMoney(assignedCents, true)}
                    </div>
                  )}
                </div>
              </label>
            );
          })}
        </div>
      </div>
    );
  }

  /* ==========================================================================
     2. MODO: REPARTO PORCENTAJE
     ========================================================================== */
  if (tipoReparto === 'PORCENTAJE') {
    const rawList = selectedParticipants.map((p) => ({
      persona_id: p.persona_id,
      porcentaje: p.porcentaje !== undefined ? p.porcentaje : '',
    }));

    const validation = validatePercentageSum(rawList);

    const handlePercentageChange = (memberId, value) => {
      const next = rawList.map((p) => {
        if (p.persona_id === memberId) {
          return { ...p, porcentaje: value };
        }
        return p;
      });
      onChangeParticipants(next);
    };

    return (
      <div className="card" style={{ background: 'var(--color-bg-surface)', marginTop: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Percent size={18} color="var(--color-primary)" />
            <span style={{ fontWeight: 600, fontSize: '0.9375rem' }}>
              Distribución por Porcentaje (Debe sumar exactamente 100.00%)
            </span>
          </div>

          <div
            className={`badge ${validation.isValid ? 'badge-success' : 'badge-warning'}`}
            style={{ fontSize: '0.8125rem' }}
          >
            {validation.isValid ? (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                <CheckCircle2 size={14} /> Total: 100.00%
              </span>
            ) : (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                <AlertCircle size={14} /> Total: {validation.totalPct.toFixed(2)}% ({validation.error})
              </span>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {groupMembers.map((member) => {
            const currentItem = rawList.find((p) => p.persona_id === member.id) || { porcentaje: '' };
            const pct = Number(currentItem.porcentaje) || 0;
            const estimatedCents = Math.round((totalCents * pct) / 100);

            return (
              <div
                key={member.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 140px 140px',
                  alignItems: 'center',
                  gap: '1rem',
                  padding: '0.75rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--color-bg-card)',
                  border: '1px solid var(--color-border)',
                }}
              >
                <div>
                  <div style={{ fontWeight: 500, fontSize: '0.875rem' }}>{member.nombre}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{member.email}</div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    placeholder="0.00"
                    value={currentItem.porcentaje}
                    onChange={(e) => handlePercentageChange(member.id, e.target.value)}
                    className="form-input"
                    style={{ textAlign: 'right', padding: '0.375rem 0.5rem' }}
                  />
                  <span style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>%</span>
                </div>

                <div style={{ textAlign: 'right', fontSize: '0.875rem', fontWeight: 600 }}>
                  {formatMoney(estimatedCents, true)}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  /* ==========================================================================
     3. MODO: REPARTO EXACTO
     ========================================================================== */
  if (tipoReparto === 'EXACTO') {
    const rawList = selectedParticipants.map((p) => ({
      persona_id: p.persona_id,
      monto_asignado: p.monto_asignado !== undefined ? p.monto_asignado : '',
    }));

    const validation = validateExactSum(rawList, totalAmount);

    const handleAmountChange = (memberId, value) => {
      const next = rawList.map((p) => {
        if (p.persona_id === memberId) {
          return { ...p, monto_asignado: value };
        }
        return p;
      });
      onChangeParticipants(next);
    };

    return (
      <div className="card" style={{ background: 'var(--color-bg-surface)', marginTop: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Calculator size={18} color="var(--color-primary)" />
            <span style={{ fontWeight: 600, fontSize: '0.9375rem' }}>
              Distribución por Montos Exactos (Debe coincidir con {formatMoney(totalCents, true)})
            </span>
          </div>

          <div
            className={`badge ${validation.isValid ? 'badge-success' : 'badge-warning'}`}
            style={{ fontSize: '0.8125rem' }}
          >
            {validation.isValid ? (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                <CheckCircle2 size={14} /> Cuadre exacto
              </span>
            ) : (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                <AlertCircle size={14} /> Asignado: {formatMoney(validation.totalAssignedCents, true)} ({validation.error})
              </span>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {groupMembers.map((member) => {
            const currentItem = rawList.find((p) => p.persona_id === member.id) || { monto_asignado: '' };

            return (
              <div
                key={member.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 180px',
                  alignItems: 'center',
                  gap: '1rem',
                  padding: '0.75rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--color-bg-card)',
                  border: '1px solid var(--color-border)',
                }}
              >
                <div>
                  <div style={{ fontWeight: 500, fontSize: '0.875rem' }}>{member.nombre}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{member.email}</div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                  <span style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>₡</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={currentItem.monto_asignado}
                    onChange={(e) => handleAmountChange(member.id, e.target.value)}
                    className="form-input"
                    style={{ textAlign: 'right', padding: '0.375rem 0.5rem' }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return null;
}

export default SplitEditor;
