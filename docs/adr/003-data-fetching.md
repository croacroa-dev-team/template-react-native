# ADR-003: Use React Query for Data Fetching

## Status

Accepted

## Date

2024-01-01

## Context

We need a data fetching solution that handles:

1. Caching and cache invalidation
2. Loading and error states
3. Optimistic updates
4. Offline support
5. Request deduplication
6. Background refetching

Options considered:

- **fetch/axios only**: Manual state management
- **SWR**: Lightweight, good for web
- **React Query (TanStack Query)**: Full-featured
- **RTK Query**: Redux-based
- **Apollo Client**: GraphQL-focused

## Decision

We chose **React Query (TanStack Query)** for server state management.

## Rationale

1. **Comprehensive Feature Set**
   - Automatic caching and cache invalidation
   - Background refetching
   - Optimistic updates
   - Infinite queries for pagination
   - Offline support with persistence

2. **Excellent Developer Experience**

   ```tsx
   const { data, isLoading, error } = useQuery({
     queryKey: ["users", userId],
     queryFn: () => api.get(`/users/${userId}`),
   });
   ```

3. **Offline Support**: Works great with AsyncStorage persister

   ```tsx
   const persister = createAsyncStoragePersister({
     storage: AsyncStorage,
   });

   <PersistQueryClientProvider
     client={queryClient}
     persistOptions={{ persister }}
   >
   ```

4. **Performance**: Smart refetching, request deduplication

5. **DevTools**: React Query DevTools for debugging

## Consequences

### Positive

- No need for manual cache management
- Automatic loading/error states
- Works offline with persisted cache
- Reduces boilerplate significantly
- Battle-tested and well-documented

### Negative

- Learning curve for query keys and cache invalidation
- Can be overkill for simple apps
- Adds bundle size (~12KB gzipped)

### Mitigation

- Create query key factories for consistency
- Document common patterns
- Create custom hooks for reusable queries

## Implementation

### Query Client Configuration

```ts
// services/queryClient.ts
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 30 * 60 * 1000, // 30 minutes
      retry: 3,
      refetchOnReconnect: true,
    },
  },
});
```

### Query Keys Factory

```ts
// hooks/useApi.ts
export const queryKeys = {
  users: {
    all: ["users"] as const,
    detail: (id: string) => ["users", id] as const,
    me: () => ["users", "me"] as const,
  },
  posts: {
    all: ["posts"] as const,
    list: (filters: PostFilters) => ["posts", filters] as const,
    detail: (id: string) => ["posts", id] as const,
  },
};
```

### Custom Hook Pattern

```ts
export function useUser(userId: string) {
  return useQuery({
    queryKey: queryKeys.users.detail(userId),
    queryFn: () => api.get<User>(`/users/${userId}`),
    enabled: !!userId,
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateUserInput) => api.patch<User>("/users/me", data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.users.me(),
      });
    },
  });
}
```

## References

- [TanStack Query Documentation](https://tanstack.com/query)
- [React Query Offline Support](https://tanstack.com/query/latest/docs/react/plugins/persistQueryClient)
