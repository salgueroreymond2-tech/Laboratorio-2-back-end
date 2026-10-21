import { useState, useCallback } from 'react';

/**
 * Hook reutilizable para manejo de formularios controlados y validación reactiva.
 * @param {object} initialValues 
 * @param {Function} validateFn - Función opcional que recibe values y retorna objeto con errores
 */
export function useForm(initialValues = {}, validateFn = null) {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    const finalVal = type === 'checkbox' ? checked : value;

    setValues((prev) => ({
      ...prev,
      [name]: finalVal,
    }));

    // Limpiar error del campo al modificarlo
    setErrors((prev) => {
      if (!prev[name]) return prev;
      const copy = { ...prev };
      delete copy[name];
      return copy;
    });
  }, []);

  const handleBlur = useCallback((e) => {
    const { name } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
  }, []);

  const setValue = useCallback((name, value) => {
    setValues((prev) => ({
      ...prev,
      [name]: value,
    }));
    setErrors((prev) => {
      if (!prev[name]) return prev;
      const copy = { ...prev };
      delete copy[name];
      return copy;
    });
  }, []);

  const reset = useCallback(
    (newValues = initialValues) => {
      setValues(newValues);
      setErrors({});
      setTouched({});
      setIsSubmitting(false);
    },
    [initialValues]
  );

  const handleSubmit = useCallback(
    (onSubmit) => async (e) => {
      if (e && e.preventDefault) {
        e.preventDefault();
      }

      if (validateFn) {
        const validationErrors = validateFn(values);
        if (validationErrors && Object.keys(validationErrors).length > 0) {
          setErrors(validationErrors);
          return;
        }
      }

      setIsSubmitting(true);
      try {
        await onSubmit(values);
      } finally {
        setIsSubmitting(false);
      }
    },
    [values, validateFn]
  );

  return {
    values,
    errors,
    touched,
    isSubmitting,
    handleChange,
    handleBlur,
    setValue,
    setValues,
    setErrors,
    reset,
    handleSubmit,
  };
}
