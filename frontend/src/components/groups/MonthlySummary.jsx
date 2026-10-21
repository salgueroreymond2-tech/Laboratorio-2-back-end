import React, { useState } from 'react';
import { generateMonthlySummary } from '../../services/n8nApi.js';
import { formatMoney } from '../../utils/money.js';
import { Sparkles, RefreshCw, Calendar, Lightbulb, AlertTriangle, FileText } from 'lucide-react';

export function MonthlySummary({ grupoId, gastos = [], balances = [] }) {
  const currentMonth = new Date().toISOString().slice(0, 7);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);

  const [isLoading, setIsLoading] = useState(false);
  const [summaryData, setSummaryData] = useState(null);
  const [error, setError] = useState(null);

  const handleGenerate = async () => {
    setIsLoading(true);
    setError(null);

    // Filtrar gastos del mes seleccionado
    const monthExpenses = gastos.filter((g) => {
      const gDate = String(g.fecha || '').slice(0, 7);
      return gDate === selectedMonth;
    });

    try {
      const result = await generateMonthlySummary({
        grupo_id: grupoId,
        mes: selectedMonth,
        gastos: monthExpenses,
        balances: balances,
      });
      setSummaryData(result);
    } catch (err) {
      setError(
        err.message ||
          'No se pudo generar el resumen mensual con n8n. Verifica que el webhook esté activo.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="card" style={{ background: 'var(--color-bg-card)', marginTop: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          <div
            style={{
              background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(236, 72, 153, 0.2) 100%)',
              color: '#c084fc',
              padding: '0.5rem',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
            }}
          >
            <Sparkles size={22} />
          </div>
          <div>
            <h4 style={{ fontSize: '1.125rem', color: 'var(--color-text-primary)' }}>
              Resumen Mensual Inteligente (Agente IA)
            </h4>
            <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
              Genera un balance en lenguaje natural y recomendaciones automáticas mediante n8n.
            </p>
          </div>
        </div>

        {/* Selector de Mes y Botón de Generar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
            <Calendar size={16} color="var(--color-text-muted)" />
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="form-input"
              style={{ padding: '0.375rem 0.625rem', fontSize: '0.875rem', width: 'auto' }}
            />
          </div>

          <button
            type="button"
            onClick={handleGenerate}
            disabled={isLoading}
            className="btn btn-ai btn-sm"
          >
            {isLoading ? (
              <>
                <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} />
                Analizando con IA...
              </>
            ) : (
              <>
                <Sparkles size={14} />
                {summaryData ? 'Volver a generar' : 'Generar resumen con IA'}
              </>
            )}
          </button>
        </div>
      </div>

      {/* Error del Webhook */}
      {error && (
        <div
          role="alert"
          style={{
            background: 'var(--color-danger-bg)',
            border: '1px solid var(--color-danger-border)',
            color: 'var(--color-danger)',
            padding: '1rem',
            borderRadius: 'var(--radius-md)',
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.625rem',
          }}
        >
          <AlertTriangle size={20} />
          <span style={{ fontSize: '0.875rem' }}>{error}</span>
        </div>
      )}

      {/* Contenido generado por la IA */}
      {summaryData && (
        <div
          style={{
            background: 'var(--color-bg-surface)',
            border: '1px solid rgba(139, 92, 246, 0.3)',
            borderRadius: 'var(--radius-md)',
            padding: '1.25rem',
            marginTop: '0.5rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FileText size={18} color="#c084fc" />
              <span style={{ fontWeight: 600, fontSize: '0.9375rem' }}>
                Informe Financiero del Mes: {summaryData.mes}
              </span>
            </div>
            <span
              className="badge"
              style={{
                background: 'rgba(139, 92, 246, 0.15)',
                color: '#c4b5fd',
                border: '1px solid rgba(139, 92, 246, 0.3)',
              }}
            >
              Generado por Agente IA n8n
            </span>
          </div>

          {/* Estadísticas clave detectadas */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem', marginBottom: '1rem' }}>
            {summaryData.total_gastado && (
              <div style={{ background: 'var(--color-bg-card)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'block' }}>Gasto en el mes</span>
                <strong style={{ fontSize: '1.125rem', color: 'var(--color-text-primary)' }}>
                  {formatMoney(summaryData.total_gastado)}
                </strong>
              </div>
            )}
            {summaryData.categoria_principal && (
              <div style={{ background: 'var(--color-bg-card)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'block' }}>Categoría principal</span>
                <strong style={{ fontSize: '1.125rem', color: 'var(--color-secondary)' }}>
                  {summaryData.categoria_principal}
                </strong>
              </div>
            )}
          </div>

          {/* Resumen en texto plano */}
          <div style={{ marginBottom: '1.25rem' }}>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9375rem', lineHeight: '1.6', whiteSpace: 'pre-line' }}>
              {summaryData.resumen}
            </p>
          </div>

          {/* Lista de Recomendaciones */}
          {Array.isArray(summaryData.recomendaciones) && summaryData.recomendaciones.length > 0 && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', marginBottom: '0.5rem', color: 'var(--color-warning)', fontWeight: 600, fontSize: '0.875rem' }}>
                <Lightbulb size={16} />
                <span>Recomendaciones sugeridas:</span>
              </div>
              <ul style={{ paddingLeft: '1.25rem', color: 'var(--color-text-secondary)', fontSize: '0.875rem', lineHeight: '1.6' }}>
                {summaryData.recomendaciones.map((rec, i) => (
                  <li key={i}>{rec}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default MonthlySummary;
