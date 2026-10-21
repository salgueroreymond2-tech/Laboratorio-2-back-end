import React from 'react';
import { Search, RotateCcw, Filter } from 'lucide-react';
import { ALLOWED_CATEGORIES } from '../../services/n8nApi.js';

export function ExpenseFilters({
  filters,
  onChangeFilter,
  onResetFilters,
  grupos = [],
  totalCount = 0,
  filteredCount = 0,
}) {
  return (
    <div
      className="card"
      style={{
        background: 'var(--color-bg-card)',
        marginBottom: '1.5rem',
        padding: '1.25rem',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9375rem', fontWeight: 600 }}>
          <Filter size={18} color="var(--color-primary)" />
          <span>Filtros y Ordenamiento</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
            Mostrando <strong>{filteredCount}</strong> de <strong>{totalCount}</strong> gastos
          </span>

          <button
            type="button"
            onClick={onResetFilters}
            className="btn btn-secondary btn-sm"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
          >
            <RotateCcw size={14} /> Limpiar filtros
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        {/* Búsqueda por descripción */}
        <div className="form-group" style={{ margin: 0 }}>
          <label htmlFor="search-input" className="form-label">
            Buscar por descripción
          </label>
          <div style={{ position: 'relative' }}>
            <input
              id="search-input"
              type="text"
              placeholder="Buscar..."
              value={filters.search}
              onChange={(e) => onChangeFilter('search', e.target.value)}
              className="form-input"
              style={{ paddingLeft: '2.25rem' }}
            />
            <Search
              size={16}
              style={{
                position: 'absolute',
                left: '0.75rem',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--color-text-muted)',
              }}
            />
          </div>
        </div>

        {/* Filtro por Grupo */}
        <div className="form-group" style={{ margin: 0 }}>
          <label htmlFor="filter-group" className="form-label">
            Filtrar por grupo
          </label>
          <select
            id="filter-group"
            value={filters.grupo_id}
            onChange={(e) => onChangeFilter('grupo_id', e.target.value)}
            className="form-select"
          >
            <option value="">Todos los grupos</option>
            {(grupos || []).map((g) => (
              <option key={g.id} value={g.id}>
                {g.nombre}
              </option>
            ))}
          </select>
        </div>

        {/* Filtro por Categoría */}
        <div className="form-group" style={{ margin: 0 }}>
          <label htmlFor="filter-category" className="form-label">
            Categoría
          </label>
          <select
            id="filter-category"
            value={filters.categoria}
            onChange={(e) => onChangeFilter('categoria', e.target.value)}
            className="form-select"
          >
            <option value="">Todas las categorías</option>
            {ALLOWED_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Filtro por Tipo de Reparto */}
        <div className="form-group" style={{ margin: 0 }}>
          <label htmlFor="filter-split" className="form-label">
            Tipo de reparto
          </label>
          <select
            id="filter-split"
            value={filters.tipo_reparto}
            onChange={(e) => onChangeFilter('tipo_reparto', e.target.value)}
            className="form-select"
          >
            <option value="">Todos los tipos</option>
            <option value="IGUALES">Equitativo (Iguales)</option>
            <option value="PORCENTAJE">Por Porcentaje</option>
            <option value="EXACTO">Montos Exactos</option>
          </select>
        </div>

        {/* Ordenar por */}
        <div className="form-group" style={{ margin: 0 }}>
          <label htmlFor="filter-order" className="form-label">
            Ordenar por
          </label>
          <select
            id="filter-order"
            value={filters.orderBy}
            onChange={(e) => onChangeFilter('orderBy', e.target.value)}
            className="form-select"
          >
            <option value="fecha-desc">Más recientes primero</option>
            <option value="fecha-asc">Más antiguos primero</option>
            <option value="monto-desc">Mayor monto</option>
            <option value="monto-asc">Menor monto</option>
            <option value="desc-asc">Descripción (A - Z)</option>
            <option value="desc-desc">Descripción (Z - A)</option>
          </select>
        </div>
      </div>
    </div>
  );
}

export default ExpenseFilters;
