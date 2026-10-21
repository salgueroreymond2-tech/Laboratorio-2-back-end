import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Hook reutilizable para ejecutar peticiones asíncronas con soporte para:
 * - Cancelación de AbortController al desmontar
 * - Prevención de memory leaks
 * - Preservación de códigos de estado HTTP (400, 404, 409)
 * - Refetch manual
 *
 * @param {Function} fetchFn - Función que retorna una promesa (recibe signal)
 * @param {Array} deps - Array de dependencias para re-ejecución
 * @param {boolean} immediate - Si se debe ejecutar automáticamente al montar (default: true)
 */
export function useFetch(fetchFn, deps = [], immediate = true) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(immediate);
  const [error, setError] = useState(null);

  const isMountedRef = useRef(true);
  const abortControllerRef = useRef(null);

  const execute = useCallback(
    async (...args) => {
      // Cancelar solicitud previa si sigue pendiente
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      const controller = new AbortController();
      abortControllerRef.current = controller;

      setLoading(true);
      setError(null);

      try {
        const result = await fetchFn(controller.signal, ...args);
        if (isMountedRef.current) {
          setData(result);
          setError(null);
          setLoading(false);
        }
        return result;
      } catch (err) {
        if (err.name === 'AbortError') {
          return null;
        }
        if (isMountedRef.current) {
          setError(err);
          setLoading(false);
        }
        throw err;
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    deps
  );

  useEffect(() => {
    isMountedRef.current = true;

    if (immediate) {
      execute().catch(() => {});
    }

    return () => {
      isMountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [execute, immediate]);

  return {
    data,
    loading,
    error,
    refetch: execute,
    setData,
  };
}
