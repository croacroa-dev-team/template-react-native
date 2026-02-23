import { useState, useEffect, useCallback } from "react";
import { Database } from "@/services/database/database-adapter";

/**
 * Hook for declarative database queries with auto-refetch.
 */
export function useDatabase<T>(
  query: string,
  params?: unknown[],
  deps: unknown[] = [],
): {
  data: T[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
} {
  const [data, setData] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await Database.query<T>(query, params);
      setData(result);
    } catch (e) {
      setError(e as Error);
    } finally {
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, JSON.stringify(params), ...deps]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, isLoading, error, refetch: fetchData };
}
