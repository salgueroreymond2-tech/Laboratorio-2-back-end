import React from 'react';
import { useFetch } from '../hooks/useFetch.js';
import { getResumen } from '../services/api.js';
import { formatMoney } from '../utils/money.js';
import { MetricCard } from '../components/dashboard/MetricCard.jsx';
import { LoadingSpinner } from '../components/common/LoadingSpinner.jsx';
import { ErrorAlert } from '../components/common/ErrorAlert.jsx';
import { EmptyState } from '../components/common/EmptyState.jsx';
import { Users, FolderGit2, Receipt, DollarSign, ArrowRightLeft, TrendingUp, Layers } from 'lucide-react';
import { Link } from 'react-router-dom';

export function DashboardPage() {
  const { data: resumen, loading, error, refetch } = useFetch(getResumen);

  if (loading) {
    return <LoadingSpinner message="Cargando métricas del sistema..." />;
  }

  if (error) {
    return <ErrorAlert error={error} onRetry={refetch} />;
  }

  if (!resumen || !resumen.global) {
    return (
      <EmptyState
        title="Sin información disponible"
        description="No se pudieron recuperar las métricas generales del sistema."
        actionText="Reintentar"
        onAction={refetch}
      />
    );
  }

  const { global: stats, grupos = [] } = resumen;

  // Cálculo de promedio global si hay gastos
  const avgExpense =
    Number(stats.total_gastos) > 0
      ? Number(stats.monto_global_gastado) / Number(stats.total_gastos)
      : 0;

  return (
    <div>
      {/* Título de la página */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '0.375rem' }}>Panel General de Métricas</h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9375rem' }}>
          Resumen estadístico y financiero global calculado mediante consultas SQL en PostgreSQL.
        </p>
      </div>

      {/* Cuadrícula de Métricas Globales */}
      <div className="grid-metrics" style={{ marginBottom: '2rem' }}>
        <MetricCard
          title="Total de Personas"
          value={stats.total_personas}
          subtitle="Registradas en el sistema"
          icon={Users}
          color="#38bdf8"
        />
        <MetricCard
          title="Grupos Activos"
          value={stats.total_grupos}
          subtitle="Grupos de gastos creados"
          icon={FolderGit2}
          color="#818cf8"
        />
        <MetricCard
          title="Total de Gastos"
          value={stats.total_gastos}
          subtitle={`Promedio: ${formatMoney(avgExpense)}`}
          icon={Receipt}
          color="#34d399"
        />
        <MetricCard
          title="Monto Global Gastado"
          value={formatMoney(stats.monto_global_gastado)}
          subtitle="Acumulado en todos los grupos"
          icon={DollarSign}
          color="#f472b6"
        />
      </div>

      {/* Fila secundaria de métricas de liquidaciones */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', marginBottom: '2.5rem' }}>
        <MetricCard
          title="Liquidaciones Realizadas"
          value={stats.total_liquidaciones}
          subtitle="Transferencias de saldos registradas"
          icon={ArrowRightLeft}
          color="#fbbf24"
        />
        <MetricCard
          title="Monto Global Liquidado"
          value={formatMoney(stats.monto_global_liquidaciones)}
          subtitle="Total de dinero transferido para saldar"
          icon={TrendingUp}
          color="#a78bfa"
        />
      </div>

      {/* Desglose de Métricas por Grupo */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Layers size={20} color="var(--color-primary)" />
            <h2 style={{ fontSize: '1.375rem' }}>Estadísticas Detalladas por Grupo</h2>
          </div>
          <Link to="/grupos" className="btn btn-secondary btn-sm">
            Ver todos los grupos
          </Link>
        </div>

        {grupos.length === 0 ? (
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9375rem' }}>
            No hay grupos registrados en este momento.
          </p>
        ) : (
          <div className="table-responsive">
            <table className="data-table" aria-label="Estadísticas de gastos por grupo">
              <thead>
                <tr>
                  <th>Grupo</th>
                  <th>Integrantes</th>
                  <th>Gastos</th>
                  <th>Total Gastado</th>
                  <th>Promedio / Gasto</th>
                  <th>Liquidaciones</th>
                  <th>Monto Liquidado</th>
                  <th style={{ textAlign: 'right' }}>Acción</th>
                </tr>
              </thead>
              <tbody>
                {grupos.map((g) => (
                  <tr key={g.grupo_id}>
                    <td>
                      <strong style={{ color: 'var(--color-text-primary)' }}>{g.grupo_nombre}</strong>
                    </td>
                    <td>
                      <span className="badge badge-neutral">{g.cantidad_integrantes} miembros</span>
                    </td>
                    <td>{g.numero_gastos}</td>
                    <td style={{ fontWeight: 600, color: 'var(--color-primary)' }}>
                      {formatMoney(g.total_gastado)}
                    </td>
                    <td style={{ color: 'var(--color-text-secondary)' }}>
                      {formatMoney(g.promedio_gasto)}
                    </td>
                    <td>{g.cantidad_liquidaciones}</td>
                    <td style={{ color: 'var(--color-success)', fontWeight: 500 }}>
                      {formatMoney(g.monto_liquidaciones)}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <Link to={`/grupos/${g.grupo_id}`} className="btn btn-secondary btn-sm">
                        Ver Balances & IA
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default DashboardPage;
