import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Data-fetching hook with the three states every screen needs, plus a manual
 * `refresh()` so mutations can re-pull without a page reload.
 *
 * `deps` behaves like a useEffect dependency list.
 */
export const useApi = (fetcher, deps = [], { immediate = true, initialData = null } = {}) => {
  const [data, setData] = useState(initialData);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(immediate);
  const [error, setError] = useState(null);
  const mounted = useRef(true);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  const run = useCallback(async (...args) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetcherRef.current(...args);
      if (!mounted.current) return null;
      setData(response?.data ?? response ?? null);
      setMeta(response?.meta ?? null);
      return response;
    } catch (err) {
      if (mounted.current) setError(err);
      return null;
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (immediate) run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { data, meta, loading, error, refresh: run, setData };
};

/** Tracks a one-off mutation (submit, publish, award…). */
export const useMutation = (mutator) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const mutate = useCallback(
    async (...args) => {
      setLoading(true);
      setError(null);
      try {
        return await mutator(...args);
      } catch (err) {
        setError(err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [mutator],
  );

  return { mutate, loading, error, setError };
};

/** Debounces a fast-changing value — used by the search boxes. */
export const useDebounced = (value, delay = 350) => {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
};
