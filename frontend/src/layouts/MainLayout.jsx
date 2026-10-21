import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { LayoutDashboard, Receipt, Users, User, Menu, X, Sparkles, Sun, Moon } from 'lucide-react';

export function MainLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  // Estado del tema: 'light' (Beige/Blanco hueso) o 'dark' (Obsidian/Esmeralda)
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'light';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

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
          background: 'var(--color-bg-header)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderBottom: '1px solid var(--color-border)',
          position: 'sticky',
          top: 0,
          zIndex: 40,
          transition: 'background var(--transition-fast), border-color var(--transition-fast)',
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
                background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-hover) 100%)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: 'var(--shadow-glow)',
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
                        color: isActive ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                        background: isActive ? 'var(--color-primary-light)' : 'transparent',
                        border: `1px solid ${isActive ? 'var(--color-border-focus)' : 'transparent'}`,
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

          {/* Acciones de la derecha: Botón de Tema y Menú Móvil */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {/* Botón de Modo Claro (Beige) / Oscuro */}
            <button
              type="button"
              onClick={toggleTheme}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.4375rem 0.875rem',
                borderRadius: 'var(--radius-full)',
                background: 'var(--color-bg-elevated)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-text-primary)',
                cursor: 'pointer',
                fontSize: '0.8125rem',
                fontWeight: 600,
                transition: 'all var(--transition-fast)',
                boxShadow: 'var(--shadow-sm)',
              }}
              title={theme === 'light' ? 'Cambiar a modo oscuro' : 'Cambiar a modo claro (beige)'}
              aria-label="Alternar modo de color"
            >
              {theme === 'light' ? (
                <>
                  <Moon size={16} color="var(--color-secondary)" />
                  <span className="theme-toggle-text">Modo Oscuro</span>
                </>
              ) : (
                <>
                  <Sun size={16} color="#fbbf24" />
                  <span className="theme-toggle-text">Modo Beige</span>
                </>
              )}
            </button>

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
          transition: 'background var(--transition-fast), border-color var(--transition-fast)',
        }}
      >
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
          <span>DiviGastos · Control de Gastos Compartidos con Liquidaciones</span>
          <span>Desarrollado con React, Express, PostgreSQL y Agente IA n8n</span>
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
        @media (max-width: 480px) {
          .theme-toggle-text {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}

export default MainLayout;
