import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  getGrupo,
  getBalancesGrupo,
  getLiquidacionesSugeridas,
  getGastos,
  getPersonas,
  addPersonToGroup,
  removePersonFromGroup,
  createLiquidacion,
} from '../services/api.js';
import { BalanceList } from '../components/groups/BalanceList.jsx';
import { SettlementSuggestions } from '../components/groups/SettlementSuggestions.jsx';
import { MonthlySummary } from '../components/groups/MonthlySummary.jsx';
import { LoadingSpinner } from '../components/common/LoadingSpinner.jsx';
import { ErrorAlert } from '../components/common/ErrorAlert.jsx';
import { ConfirmDialog } from '../components/common/ConfirmDialog.jsx';
import { StatusMessage } from '../components/common/StatusMessage.jsx';
import {
  ArrowLeft,
  Users,
  UserPlus,
  Scale,
  Receipt,
  PlusCircle,
  X,
  UserCheck,
} from 'lucide-react';

export function GroupDetailPage() {
  const { id } = useParams();

  // Estados de datos
  const [grupo, setGrupo] = useState(null);
  const [balancesData, setBalancesData] = useState(null);
  const [suggestionsData, setSuggestionsData] = useState(null);
  const [gastos, setGastos] = useState([]);
  const [allPersonas, setAllPersonas] = useState([]);

  // Estados de carga y error
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // Estados de modales y acciones
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [selectedPersonToAdd, setSelectedPersonToAdd] = useState('');
  const [isAddingMember, setIsAddingMember] = useState(false);

  const [personToRemove, setPersonToRemove] = useState(null);
  const [isRemovingPerson, setIsRemovingPerson] = useState(false);
  const [isApplyingSettlement, setIsApplyingSettlement] = useState(false);

  // Carga global de todos los recursos del grupo
  const loadGroupDetails = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [grupoRes, balancesRes, suggestionsRes, gastosRes, personasRes] = await Promise.all([
        getGrupo(id),
        getBalancesGrupo(id),
        getLiquidacionesSugeridas(id),
        getGastos({ grupo_id: id }),
        getPersonas(),
      ]);

      setGrupo(grupoRes);
      setBalancesData(balancesRes);
      setSuggestionsData(suggestionsRes);
      setGastos(gastosRes || []);
      setAllPersonas(personasRes || []);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadGroupDetails();
  }, [loadGroupDetails]);

  // Recarga silenciosa tras operaciones como liquidaciones o agregar miembros
  const silentRefresh = async () => {
    try {
      const [balancesRes, suggestionsRes, gastosRes, grupoRes] = await Promise.all([
        getBalancesGrupo(id),
        getLiquidacionesSugeridas(id),
        getGastos({ grupo_id: id }),
        getGrupo(id),
      ]);
      setBalancesData(balancesRes);
      setSuggestionsData(suggestionsRes);
      setGastos(gastosRes || []);
      setGrupo(grupoRes);
    } catch (err) {
      console.error('Error al actualizar datos silenciosamente:', err);
    }
  };

  // Agregar persona al grupo
  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!selectedPersonToAdd) return;

    setIsAddingMember(true);
    setActionError(null);
    try {
      await addPersonToGroup(id, selectedPersonToAdd);
      setSuccessMessage('Integrante agregado al grupo exitosamente.');
      setShowAddMemberModal(false);
      setSelectedPersonToAdd('');
      await silentRefresh();
    } catch (err) {
      setActionError(err);
    } finally {
      setIsAddingMember(false);
    }
  };

  // Retirar integrante del grupo (Manejando 409 si balance != 0.00)
  const handleConfirmRemovePerson = async () => {
    if (!personToRemove) return;

    setIsRemovingPerson(true);
    setActionError(null);
    try {
      const res = await removePersonFromGroup(id, personToRemove.persona_id);
      setSuccessMessage(res.mensaje || 'Integrante retirado del grupo exitosamente.');
      setPersonToRemove(null);
      await silentRefresh();
    } catch (err) {
      // Si el backend devuelve 409 (saldo pendiente), NO eliminamos visualmente y mostramos el error
      setActionError(err);
      setPersonToRemove(null);
    } finally {
      setIsRemovingPerson(false);
    }
  };

  // Registrar liquidación sugerida
  const handleApplySettlement = async (settlement) => {
    setIsApplyingSettlement(true);
    setActionError(null);
    try {
      await createLiquidacion({
        grupo_id: Number(id),
        de_persona: settlement.de_persona,
        a_persona: settlement.a_persona,
        monto: Number(settlement.monto),
      });
      setSuccessMessage(
        `Liquidación registrada con éxito: ${settlement.de_nombre} pagó ₡${settlement.monto} a ${settlement.a_nombre}.`
      );
      await silentRefresh();
    } catch (err) {
      setActionError(err);
    } finally {
      setIsApplyingSettlement(false);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Cargando balances e información del grupo..." />;
  }

  if (error) {
    return (
      <ErrorAlert
        error={error}
        onRetry={loadGroupDetails}
        backLink="/grupos"
        backText="Volver al listado de grupos"
      />
    );
  }

  if (!grupo) return null;

  // Personas disponibles para agregar (que no estén ya en el grupo)
  const currentMemberIds = new Set((grupo.integrantes || []).map((m) => m.id));
  const availablePeopleToAdd = allPersonas.filter((p) => !currentMemberIds.has(p.id));

  return (
    <div>
      {/* Navegación y Cabecera del Grupo */}
      <div style={{ marginBottom: '1.5rem' }}>
        <Link
          to="/grupos"
          className="btn btn-secondary btn-sm"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', marginBottom: '1rem' }}
        >
          <ArrowLeft size={16} /> Volver a Grupos
        </Link>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>{grupo.nombre}</h1>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9375rem' }}>
              Gestión de balances, transferencias sugeridas y análisis con IA.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <Link to="/gastos/nuevo" className="btn btn-secondary btn-sm">
              <PlusCircle size={15} /> Registrar Gasto
            </Link>
            <button
              type="button"
              onClick={() => {
                setActionError(null);
                setShowAddMemberModal(true);
              }}
              className="btn btn-primary btn-sm"
            >
              <UserPlus size={15} /> Agregar Integrante
            </button>
          </div>
        </div>
      </div>

      {/* Notificaciones de éxito o errores operacionales */}
      {successMessage && (
        <StatusMessage
          type="success"
          message={successMessage}
          onClose={() => setSuccessMessage(null)}
        />
      )}

      {actionError && (
        <ErrorAlert
          error={actionError}
          onRetry={() => setActionError(null)}
        />
      )}

      {/* Sección 1: Balances Netos de Integrantes */}
      <div className="card" style={{ marginBottom: '1.75rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Scale size={20} color="var(--color-primary)" />
            <h2 style={{ fontSize: '1.25rem' }}>Balances de los Integrantes</h2>
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
            Fórmula: balance = pagado - consumido + liquidaciones_pagadas - liquidaciones_recibidas
          </span>
        </div>

        <BalanceList
          balances={balancesData?.balances || []}
          onRemovePerson={(person) => setPersonToRemove(person)}
          removingPersonId={isRemovingPerson ? personToRemove?.persona_id : null}
        />
      </div>

      {/* Sección 2: Liquidaciones Sugeridas (Algoritmo Voraz) */}
      <div style={{ marginBottom: '1.75rem' }}>
        <SettlementSuggestions
          suggestions={suggestionsData?.liquidaciones_sugeridas || []}
          totalTransfers={suggestionsData?.cantidad_transferencias || 0}
          onApplySettlement={handleApplySettlement}
          isApplying={isApplyingSettlement}
        />
      </div>

      {/* Sección 3: Resumen Mensual Inteligente (n8n AI Agent) */}
      <MonthlySummary
        grupoId={Number(id)}
        gastos={gastos}
        balances={balancesData?.balances || []}
      />

      {/* Modal para Agregar Integrante al Grupo */}
      {showAddMemberModal && (
        <div
          role="presentation"
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 50,
            padding: '1rem',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget && !isAddingMember) setShowAddMemberModal(false);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-member-title"
            style={{
              background: 'var(--color-bg-card)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-lg)',
              maxWidth: '460px',
              width: '100%',
              padding: '1.75rem',
              boxShadow: 'var(--shadow-lg)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 id="add-member-title" style={{ fontSize: '1.25rem' }}>
                Agregar Integrante a "{grupo.nombre}"
              </h3>
              <button
                type="button"
                onClick={() => setShowAddMemberModal(false)}
                disabled={isAddingMember}
                style={{ background: 'transparent', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer' }}
                aria-label="Cerrar modal"
              >
                <X size={20} />
              </button>
            </div>

            {availablePeopleToAdd.length === 0 ? (
              <div>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9375rem', marginBottom: '1rem' }}>
                  Todas las personas registradas ya forman parte de este grupo. Puedes registrar nuevas personas en la sección de Personas.
                </p>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                  <Link to="/personas" className="btn btn-secondary">
                    Ir a Personas
                  </Link>
                  <button type="button" onClick={() => setShowAddMemberModal(false)} className="btn btn-secondary">
                    Cerrar
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleAddMember}>
                <div className="form-group">
                  <label htmlFor="select-person-add" className="form-label required">
                    Selecciona una persona
                  </label>
                  <select
                    id="select-person-add"
                    value={selectedPersonToAdd}
                    onChange={(e) => setSelectedPersonToAdd(e.target.value)}
                    className="form-select"
                    required
                  >
                    <option value="">Selecciona...</option>
                    {availablePeopleToAdd.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nombre} ({p.email})
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                  <button
                    type="button"
                    onClick={() => setShowAddMemberModal(false)}
                    disabled={isAddingMember}
                    className="btn btn-secondary"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isAddingMember || !selectedPersonToAdd}
                    className="btn btn-primary"
                  >
                    <UserCheck size={16} />
                    {isAddingMember ? 'Agregando...' : 'Agregar al Grupo'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Diálogo de Confirmación para Retirar Integrante con Advertencia 409 */}
      <ConfirmDialog
        isOpen={Boolean(personToRemove)}
        title="¿Retirar integrante del grupo?"
        message={
          personToRemove
            ? `¿Deseas retirar a ${personToRemove.nombre} de este grupo? Recuerda que el sistema únicamente permite la salida si el balance del integrante es exactamente ₡0.00. Si tiene deudas o créditos pendientes, el sistema bloqueará la operación con código 409.`
            : ''
        }
        confirmText="Intentar Retirar"
        cancelText="Cancelar"
        isDanger={true}
        isLoading={isRemovingPerson}
        onConfirm={handleConfirmRemovePerson}
        onCancel={() => setPersonToRemove(null)}
      />
    </div>
  );
}

export default GroupDetailPage;
