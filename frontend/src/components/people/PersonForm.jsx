import React, { useState, useEffect } from 'react';
import { validateRequired, validateEmail } from '../../utils/validators.js';
import { User, Mail, Save, X } from 'lucide-react';

export function PersonForm({
  initialData = null,
  onSubmit,
  onCancel,
  isSubmitting = false,
  serverError = null,
}) {
  const [nombre, setNombre] = useState(initialData?.nombre || '');
  const [email, setEmail] = useState(initialData?.email || '');
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (initialData) {
      setNombre(initialData.nombre || '');
      setEmail(initialData.email || '');
    } else {
      setNombre('');
      setEmail('');
    }
    setErrors({});
  }, [initialData]);

  const validate = () => {
    const errs = {};
    const nameErr = validateRequired(nombre, 'nombre');
    if (nameErr) errs.nombre = nameErr;

    const emailErr = validateEmail(email);
    if (emailErr) errs.email = emailErr;

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    onSubmit({ nombre: nombre.trim(), email: email.trim().toLowerCase() });
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
            padding: '0.75rem 1rem',
            borderRadius: 'var(--radius-md)',
            marginBottom: '1rem',
            fontSize: '0.875rem',
          }}
        >
          {serverError.message || 'Error al guardar la persona.'}
        </div>
      )}

      <div className="form-group">
        <label htmlFor="person-nombre" className="form-label required">
          Nombre completo
        </label>
        <div style={{ position: 'relative' }}>
          <input
            id="person-nombre"
            type="text"
            placeholder="Ej: Laura Morales"
            value={nombre}
            onChange={(e) => {
              setNombre(e.target.value);
              if (errors.nombre) setErrors((prev) => ({ ...prev, nombre: null }));
            }}
            className={`form-input ${errors.nombre ? 'is-invalid' : ''}`}
            style={{ paddingLeft: '2.25rem' }}
          />
          <User
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
        {errors.nombre && <span className="form-error">{errors.nombre}</span>}
      </div>

      <div className="form-group">
        <label htmlFor="person-email" className="form-label required">
          Correo electrónico
        </label>
        <div style={{ position: 'relative' }}>
          <input
            id="person-email"
            type="email"
            placeholder="ejemplo@correo.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (errors.email) setErrors((prev) => ({ ...prev, email: null }));
            }}
            className={`form-input ${errors.email ? 'is-invalid' : ''}`}
            style={{ paddingLeft: '2.25rem' }}
          />
          <Mail
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
        {errors.email && <span className="form-error">{errors.email}</span>}
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="btn btn-secondary"
          >
            <X size={16} /> Cancelar
          </button>
        )}
        <button
          type="submit"
          disabled={isSubmitting}
          className="btn btn-primary"
        >
          <Save size={16} /> {isSubmitting ? 'Guardando...' : initialData ? 'Guardar Cambios' : 'Registrar Persona'}
        </button>
      </div>
    </form>
  );
}

export default PersonForm;
