import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SplitEditor } from './SplitEditor.jsx';
import { classifyExpense, ALLOWED_CATEGORIES } from '../../services/n8nApi.js';
import { getGrupo } from '../../services/api.js';
import { validateRequired, validatePositiveAmount, validatePercentageSum, validateExactSum } from '../../utils/validators.js';
import { Sparkles, Save, ArrowLeft, AlertCircle, Check } from 'lucide-react';

export function ExpenseForm({
  initialData = null,
  grupos = [],
  onSubmit,
  isEdit = false,
  serverError = null,
}) {
  const navigate = useNavigate();

  // Estados del formulario
  const [grupoId, setGrupoId] = useState(initialData?.grupo_id ? String(initialData.grupo_id) : '');
  const [descripcion, setDescripcion] = useState(initialData?.descripcion || '');
  const [monto, setMonto] = useState(initialData?.monto || '');
  const [pagadoPor, setPagadoPor] = useState(initialData?.pagado_por ? String(initialData.pagado_por) : '');
  const [fecha, setFecha] = useState(initialData?.fecha || new Date().toISOString().slice(0, 10));
  const [categoria, setCategoria] = useState(initialData?.categoria || 'General');
  const [tipoReparto, setTipoReparto] = useState(initialData?.tipo_reparto || 'IGUALES');

  // Integrantes del grupo seleccionado
  const [groupMembers, setGroupMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(false);

  // Participantes seleccionados para el SplitEditor
  const [participants, setParticipants] = useState(() => {
    if (initialData?.participaciones?.length) {
      if (initialData.tipo_reparto === 'IGUALES') {
        return initialData.participaciones.map((p) => p.persona_id);
      }
      return initialData.participaciones.map((p) => ({
        persona_id: p.persona_id,
        monto_asignado: p.monto_asignado,
        porcentaje: p.porcentaje || '',
      }));
    }
    return [];
  });

  // Estado del Agente de IA (n8n)
  const [isClassifying, setIsClassifying] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState(null);
  const [aiError, setAiError] = useState(null);

  // Errores de validación cliente
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Cargar integrantes cada vez que cambia el grupo
  useEffect(() => {
    let isCancelled = false;
    async function loadMembers() {
      if (!grupoId) {
        setGroupMembers([]);
        setParticipants([]);
        return;
      }
      setLoadingMembers(true);
      try {
        const data = await getGrupo(grupoId);
        if (!isCancelled) {
          const members = data.integrantes || [];
          setGroupMembers(members);

          // Inicializar participantes si es un gasto nuevo o no hay integrantes asignados
          if (!initialData || String(initialData.grupo_id) !== String(grupoId)) {
            if (tipoReparto === 'IGUALES') {
              setParticipants(members.map((m) => m.id));
            } else if (tipoReparto === 'PORCENTAJE') {
              const count = members.length;
              if (count > 0) {
                const base = Math.floor(10000 / count);
                const rem = 10000 % count;
                setParticipants(
                  members.map((m, idx) => ({
                    persona_id: m.id,
                    porcentaje: ((base + (idx < rem ? 1 : 0)) / 100).toFixed(2),
                  }))
                );
              }
            } else {
              setParticipants(members.map((m) => ({ persona_id: m.id, monto_asignado: '' })));
            }
          }
        }
      } catch (err) {
        console.error('Error cargando integrantes del grupo:', err);
      } finally {
        if (!isCancelled) setLoadingMembers(false);
      }
    }
    loadMembers();
    return () => {
      isCancelled = true;
    };
  }, [grupoId]);

  // Si cambia el tipo de reparto, adaptar estructura de participantes
  const handleRepartoChange = (newTipo) => {
    setTipoReparto(newTipo);
    if (newTipo === 'IGUALES') {
      const ids = groupMembers.map((m) => m.id);
      setParticipants(ids);
    } else if (newTipo === 'PORCENTAJE') {
      const count = groupMembers.length;
      if (count > 0) {
        const base = Math.floor(10000 / count);
        const rem = 10000 % count;
        setParticipants(
          groupMembers.map((m, idx) => ({
            persona_id: m.id,
            porcentaje: ((base + (idx < rem ? 1 : 0)) / 100).toFixed(2),
          }))
        );
      } else {
        setParticipants([]);
      }
    } else if (newTipo === 'EXACTO') {
      const totalNum = Number(monto) || 0;
      const count = groupMembers.length;
      if (count > 0 && totalNum > 0) {
        const totalC = Math.round(totalNum * 100);
        const baseC = Math.floor(totalC / count);
        const remC = totalC % count;
        setParticipants(
          groupMembers.map((m, idx) => ({
            persona_id: m.id,
            monto_asignado: ((baseC + (idx < remC ? 1 : 0)) / 100).toFixed(2),
          }))
        );
      } else {
        setParticipants(groupMembers.map((m) => ({ persona_id: m.id, monto_asignado: '' })));
      }
    }
  };

  // Disparar sugerencia de IA mediante n8n
  const handleSuggestCategory = async () => {
    if (!descripcion.trim()) {
      setAiError('Por favor escribe primero una descripción para que la IA pueda clasificarla.');
      return;
    }
    setIsClassifying(true);
    setAiError(null);
    setAiSuggestion(null);

    try {
      const result = await classifyExpense(descripcion);
      setAiSuggestion(result);
    } catch (err) {
      setAiError(err.message || 'No se pudo conectar con el servicio de IA en n8n.');
    } finally {
      setIsClassifying(false);
    }
  };

  const applyAiCategory = () => {
    if (aiSuggestion?.categoria) {
      setCategoria(aiSuggestion.categoria);
      setAiSuggestion(null);
    }
  };

  // Validaciones del formulario
  const validate = () => {
    const newErrors = {};

    const reqGrupo = validateRequired(grupoId, 'grupo');
    if (reqGrupo) newErrors.grupo_id = 'Debes seleccionar un grupo.';

    const reqDesc = validateRequired(descripcion, 'descripción');
    if (reqDesc) newErrors.descripcion = 'La descripción del gasto es obligatoria.';

    const reqMonto = validatePositiveAmount(monto, 'monto');
    if (reqMonto) newErrors.monto = reqMonto || 'El monto debe ser un número mayor a cero.';

    const reqPagador = validateRequired(pagadoPor, 'pagador');
    if (reqPagador) newErrors.pagado_por = 'Debes seleccionar quién pagó el gasto.';

    const reqFecha = validateRequired(fecha, 'fecha');
    if (reqFecha) newErrors.fecha = 'La fecha es obligatoria.';

    // Validar participaciones según tipo de reparto
    if (tipoReparto === 'IGUALES') {
      if (!Array.isArray(participants) || participants.length === 0) {
        newErrors.participantes = 'Debes seleccionar al menos un participante para el reparto.';
      }
    } else if (tipoReparto === 'PORCENTAJE') {
      const v = validatePercentageSum(participants);
      if (!v.isValid) {
        newErrors.participantes = v.error || 'La suma de porcentajes debe ser exactamente 100.00%.';
      }
    } else if (tipoReparto === 'EXACTO') {
      const v = validateExactSum(participants, monto);
      if (!v.isValid) {
        newErrors.participantes = v.error || 'La suma de montos asignados debe coincidir con el gasto.';
      }
    }

    setErrors(newErrors);
    return { isValid: Object.keys(newErrors).length === 0, newErrors };
  };

  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    console.log('handleSubmit llamado');

    const { isValid, newErrors } = validate();
    console.log('Form validation result:', isValid, newErrors);

    if (!isValid) {
      const errorList = Object.values(newErrors);
      alert('⚠️ Faltan campos por completar:\n\n• ' + errorList.join('\n• '));

      setTimeout(() => {
        const firstInvalid = document.querySelector('.is-invalid, .form-error');
        if (firstInvalid) {
          firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 50);
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        grupo_id: Number(grupoId),
        descripcion: descripcion.trim(),
        monto: Number(monto),
        pagado_por: Number(pagadoPor),
        fecha,
        categoria: categoria || 'General',
        tipo_reparto: tipoReparto,
        participantes,
      };
      await onSubmit(payload);
    } catch (err) {
      console.error('Error al guardar el gasto:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      {serverError && (
        <div
          role="alert"
          style={{
            background: 'var(--color-danger-bg)',
            border: '1px solid var(--color-danger-border)',
            color: 'var(--color-danger)',
            padding: '1rem',
            borderRadius: 'var(--radius-md)',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.625rem',
          }}
        >
          <AlertCircle size={20} />
          <span>{serverError.message || 'Error al guardar el gasto.'}</span>
        </div>
      )}

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ marginBottom: '1.25rem', fontSize: '1.25rem' }}>Datos Generales del Gasto</h3>

        <div className="form-row cols-2">
          {/* Grupo */}
          <div className="form-group">
            <label htmlFor="grupo_id" className="form-label required">
              Grupo
            </label>
            <select
              id="grupo_id"
              value={grupoId}
              onChange={(e) => {
                setGrupoId(e.target.value);
                setPagadoPor('');
              }}
              className={`form-select ${errors.grupo_id ? 'is-invalid' : ''}`}
              disabled={isEdit}
            >
              <option value="">Selecciona un grupo...</option>
              {grupos.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.nombre}
                </option>
              ))}
            </select>
            {errors.grupo_id && <span className="form-error">{errors.grupo_id}</span>}
          </div>

          {/* Pagado Por */}
          <div className="form-group">
            <label htmlFor="pagado_por" className="form-label required">
              Pagado por
            </label>
            <select
              id="pagado_por"
              value={pagadoPor}
              onChange={(e) => setPagadoPor(e.target.value)}
              className={`form-select ${errors.pagado_por ? 'is-invalid' : ''}`}
              disabled={!grupoId || loadingMembers}
            >
              <option value="">
                {!grupoId ? 'Primero selecciona un grupo' : '¿Quién pagó el gasto?'}
              </option>
              {groupMembers.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.nombre} ({m.email})
                </option>
              ))}
            </select>
            {errors.pagado_por && <span className="form-error">{errors.pagado_por}</span>}
          </div>
        </div>

        {/* Descripción con asistente de IA */}
        <div className="form-group">
          <label htmlFor="descripcion" className="form-label required">
            Descripción del gasto
          </label>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <input
              id="descripcion"
              type="text"
              placeholder="Ej: Cena de mariscos en la playa, Combustible, Hospedaje..."
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              className={`form-input ${errors.descripcion ? 'is-invalid' : ''}`}
              style={{ flex: 1, minWidth: '240px' }}
            />
            <button
              type="button"
              onClick={handleSuggestCategory}
              disabled={isClassifying || !descripcion.trim()}
              className="btn btn-ai"
              style={{ whiteSpace: 'nowrap' }}
              title="Solicitar a n8n que sugiera una categoría automáticamente"
            >
              <Sparkles size={16} />
              {isClassifying ? 'Analizando con IA...' : 'Sugerir categoría con IA'}
            </button>
          </div>
          {errors.descripcion && <span className="form-error">{errors.descripcion}</span>}

          {/* Banner de sugerencia de IA */}
          {aiSuggestion && (
            <div
              style={{
                marginTop: '0.75rem',
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(139, 92, 246, 0.12)',
                border: '1px solid rgba(139, 92, 246, 0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '0.5rem',
              }}
            >
              <div>
                <span style={{ fontSize: '0.8125rem', color: '#c4b5fd', fontWeight: 600 }}>
                  Sugerencia IA:
                </span>{' '}
                <strong style={{ color: '#ffffff' }}>{aiSuggestion.categoria}</strong>{' '}
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                  ({Math.round(aiSuggestion.confianza * 100)}% certeza)
                </span>
                <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '0.125rem' }}>
                  {aiSuggestion.justificacion}
                </p>
              </div>
              <button
                type="button"
                onClick={applyAiCategory}
                className="btn btn-sm btn-primary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
              >
                <Check size={14} /> Aplicar categoría
              </button>
            </div>
          )}

          {aiError && (
            <div style={{ color: 'var(--color-warning)', fontSize: '0.8125rem', marginTop: '0.5rem' }}>
              ⚠️ {aiError}
            </div>
          )}
        </div>

        <div className="form-row cols-3">
          {/* Monto */}
          <div className="form-group">
            <label htmlFor="monto" className="form-label required">
              Monto total (₡)
            </label>
            <input
              id="monto"
              type="number"
              step="0.01"
              min="0.01"
              placeholder="0.00"
              value={monto}
              onChange={(e) => setMonto(e.target.value)}
              className={`form-input ${errors.monto ? 'is-invalid' : ''}`}
            />
            {errors.monto && <span className="form-error">{errors.monto}</span>}
          </div>

          {/* Fecha */}
          <div className="form-group">
            <label htmlFor="fecha" className="form-label required">
              Fecha
            </label>
            <input
              id="fecha"
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className={`form-input ${errors.fecha ? 'is-invalid' : ''}`}
            />
            {errors.fecha && <span className="form-error">{errors.fecha}</span>}
          </div>

          {/* Categoría */}
          <div className="form-group">
            <label htmlFor="categoria" className="form-label">
              Categoría
            </label>
            <select
              id="categoria"
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
              className="form-select"
            >
              {ALLOWED_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Configuración de Tipo de Reparto y Participantes */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ marginBottom: '1rem', fontSize: '1.25rem' }}>Tipo de Reparto</h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem', marginBottom: '1.25rem' }}>
          {[
            { id: 'IGUALES', label: 'Reparto Equitativo', desc: 'Monto dividido en partes iguales' },
            { id: 'PORCENTAJE', label: 'Por Porcentaje', desc: 'Suma exacta al 100.00%' },
            { id: 'EXACTO', label: 'Montos Exactos', desc: 'Asignación manual en centavos' },
          ].map((type) => (
            <button
              key={type.id}
              type="button"
              onClick={() => handleRepartoChange(type.id)}
              style={{
                textAlign: 'left',
                padding: '0.875rem 1rem',
                borderRadius: 'var(--radius-md)',
                background: tipoReparto === type.id ? 'var(--color-primary-light)' : 'var(--color-bg-input)',
                border: `2px solid ${tipoReparto === type.id ? 'var(--color-primary)' : 'var(--color-border)'}`,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <div style={{ fontWeight: 600, color: tipoReparto === type.id ? 'var(--color-primary)' : 'var(--color-text-primary)' }}>
                {type.label}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.125rem' }}>
                {type.desc}
              </div>
            </button>
          ))}
        </div>

        {errors.participantes && (
          <div style={{ color: 'var(--color-danger)', fontSize: '0.875rem', marginBottom: '1rem' }}>
            ⚠️ {errors.participantes}
          </div>
        )}

        {grupoId && groupMembers.length > 0 && (
          <SplitEditor
            tipoReparto={tipoReparto}
            totalAmount={monto}
            groupMembers={groupMembers}
            selectedParticipants={participants}
            onChangeParticipants={setParticipants}
          />
        )}
      </div>

      {/* Alerta visible encima de los botones en caso de error */}
      {Object.keys(errors).length > 0 && (
        <div
          role="alert"
          style={{
            background: 'var(--color-danger-bg)',
            border: '1px solid var(--color-danger-border)',
            color: 'var(--color-danger)',
            padding: '0.875rem 1rem',
            borderRadius: 'var(--radius-md)',
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '0.875rem',
          }}
        >
          <AlertCircle size={18} />
          <span>
            {errors.participantes
              ? errors.participantes
              : 'Por favor completa todos los campos requeridos marcados en rojo antes de guardar.'}
          </span>
        </div>
      )}

      {serverError && (
        <div
          role="alert"
          style={{
            background: 'var(--color-danger-bg)',
            border: '1px solid var(--color-danger-border)',
            color: 'var(--color-danger)',
            padding: '0.875rem 1rem',
            borderRadius: 'var(--radius-md)',
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '0.875rem',
          }}
        >
          <AlertCircle size={18} />
          <span>{serverError.message || 'Error del servidor al guardar el gasto.'}</span>
        </div>
      )}

      {/* Botones de acción */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="btn btn-secondary"
          disabled={isSubmitting}
        >
          <ArrowLeft size={16} /> Cancelar
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="btn btn-primary"
        >
          <Save size={16} />
          {isSubmitting ? 'Guardando...' : isEdit ? 'Actualizar Gasto' : 'Crear Gasto'}
        </button>
      </div>
    </form>
  );
}

export default ExpenseForm;
