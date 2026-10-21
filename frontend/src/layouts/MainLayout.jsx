import React, { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { LayoutDashboard, Receipt, Users, User, Menu, X, Sparkles } from 'lucide-react';

export function MainLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const navItems = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/gastos', label: 'Gastos', icon: Receipt },
    { to: '/grupos', label: 'Grupos', icon: Users },
    { to: '/personas', label: 'Personas', icon: User },
  ];

  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Encabezado principal */}
      <header
        style={{
          height: 'var(--header-height)',
          background: 'rgba(249, 247, 242, 0.92)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderBottom: '1px solid var(--color-border)',
          position: 'sticky',
          top: 0,
          zIndex: 40,
        }}
      >
        <div
          className="container"
          style={{
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          {/* Logo y Nombre de la Aplicación */}
          <NavLink
            to="/"
            onClick={closeMobileMenu}
            style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none' }}
          >
            <div
              style={{
                width: '2.5rem',
                height: '2.5rem',
                borderRadius: 'var(--radius-md)',
                background: 'linear-gradient(135deg, #15803d 0%, #166534 100%)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 10px rgba(21, 128, 61, 0.25)',
              }}
            >
              <Sparkles size={20} />
            </div>
            <div>
              <span
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: '1.25rem',
                  fontWeight: 800,
                  color: 'var(--color-text-primary)',
                  display: 'block',
                  lineHeight: '1.2',
                }}
              >
                DiviGastos
              </span>
              <span style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Gastos & Liquidaciones
              </span>
            </div>
          </NavLink>

          {/* Navegación para pantallas medianas y grandes */}
          <nav
            style={{ display: 'none' }}
            className="desktop-nav"
            aria-label="Navegación principal"
          >
            <ul style={{ display: 'flex', listStyle: 'none', gap: '0.5rem', alignItems: 'center' }}>
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive =
                  item.to === '/'
                    ? location.pathname === '/'
                    : location.pathname.startsWith(item.to);

                return (
                  <li key={item.to}>
                    <NavLink
                      to={item.to}
                      aria-current={isActive ? 'page' : undefined}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.5rem 0.875rem',
                        borderRadius: 'var(--radius-md)',
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        color: isActive ? '#15803d' : 'var(--color-text-secondary)',
                        background: isActive ? '#eaf5ee' : 'transparent',
                        border: `1px solid ${isActive ? '#c4e7ce' : 'transparent'}`,
                        transition: 'all var(--transition-fast)',
                      }}
                    >
                      <Icon size={16} />
                      {item.label}
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Botón de Menú Móvil */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="mobile-menu-btn"
            style={{
              background: 'transparent',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              padding: '0.5rem',
              color: 'var(--color-text-primary)',
              cursor: 'pointer',
              display: 'flex',
            }}
            aria-label={mobileMenuOpen ? 'Cerrar menú' : 'Abrir menú de navegación'}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </header>

      {/* Menú desplegable para móviles */}
      {mobileMenuOpen && (
        <div
          role="navigation"
          aria-label="Menú móvil"
          style={{
            background: 'var(--color-bg-surface)',
            borderBottom: '1px solid var(--color-border)',
            padding: '1rem',
            position: 'sticky',
            top: 'var(--header-height)',
            zIndex: 39,
          }}
        >
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.to === '/'
                  ? location.pathname === '/'
                  : location.pathname.startsWith(item.to);

              return (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    onClick={closeMobileMenu}
                    aria-current={isActive ? 'page' : undefined}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: '0.75rem 1rem',
                      borderRadius: 'var(--radius-md)',
                      fontSize: '0.9375rem',
                      fontWeight: 600,
                      color: isActive ? 'var(--color-primary)' : 'var(--color-text-primary)',
                      background: isActive ? 'var(--color-primary-light)' : 'var(--color-bg-card)',
                      border: `1px solid ${isActive ? 'var(--color-border-focus)' : 'var(--color-border)'}`,
                    }}
                  >
                    <Icon size={18} />
                    {item.label}
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* Contenido principal de la página */}
      <main style={{ flex: 1, padding: '2rem 0' }}>
        <div className="container">
          <Outlet />
        </div>
      </main>

      {/* Pie de página accesible */}
      <footer
        style={{
          background: 'var(--color-bg-surface)',
          borderTop: '1px solid var(--color-border)',
          padding: '1.5rem 0',
          textAlign: 'center',
          fontSize: '0.8125rem',
          color: 'var(--color-text-muted)',
        }}
      >
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
          <span>Control de Gastos Compartidos con Liquidaciones - Laboratorio 2</span>
          <span>Integración con Node.js, Express, PostgreSQL y Agente n8n</span>
        </div>
      </footer>

      {/* Estilos responsivos del header */}
      <style>{`
        @media (min-width: 768px) {
          .desktop-nav {
            display: block !important;
          }
          .mobile-menu-btn {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}

export default MainLayout;
