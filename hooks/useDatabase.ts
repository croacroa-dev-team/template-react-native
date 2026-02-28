import { useState, useEffect, useCallback, useRef } from "react";
import { Database } from "@/services/database/database-adapter";

/**
 * Hook for declarative database queries with auto-refetch.
 */
export function useDatabase<T>(
  query: string,
  params?: unknown[],
  deps: unknown[] = []
): {
  data: T[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
} {
  const [data, setData] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Serialize params and deps into stable strings for comparison
  const serializedParams = JSON.stringify(params);
  const serializedDeps = JSON.stringify(deps);
  const paramsRef = useRef(params);
  paramsRef.current = params;

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await Database.query<T>(query, paramsRef.current);
      setData(result);
    } catch (e) {
      setError(e as Error);
    } finally {
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, serializedParams, serializedDeps]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, isLoading, error, refetch: fetchData };
}
