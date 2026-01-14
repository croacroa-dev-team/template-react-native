import {
  useQuery,
  useMutation,
  useQueryClient,
  UseQueryOptions,
  UseMutationOptions,
} from "@tanstack/react-query";
import { api } from "@/services/api";
import { toast, handleApiError } from "@/utils/toast";

// Query keys factory for type-safe and organized cache management
export const queryKeys = {
  all: ["api"] as const,
  users: {
    all: ["users"] as const,
    detail: (id: string) => ["users", id] as const,
    me: () => ["users", "me"] as const,
  },
  posts: {
    all: ["posts"] as const,
    list: (filters: Record<string, unknown>) => ["posts", "list", filters] as const,
    detail: (id: string) => ["posts", id] as const,
  },
  // Add more query keys as needed
} as const;

// Generic types for API responses
interface PaginatedResponse<T> {
  data: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

// ===========================================
// User Hooks
// ===========================================

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

/**
 * Fetch current user profile
 */
export function useCurrentUser(
  options?: Omit<UseQueryOptions<User, Error>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: queryKeys.users.me(),
    queryFn: () => api.get<User>("/users/me"),
    staleTime: 1000 * 60 * 5, // 5 minutes
    ...options,
  });
}

/**
 * Fetch user by ID
 */
export function useUser(
  userId: string,
  options?: Omit<UseQueryOptions<User, Error>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: queryKeys.users.detail(userId),
    queryFn: () => api.get<User>(`/users/${userId}`),
    enabled: !!userId,
    ...options,
  });
}

/**
 * Update user profile
 */
export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<User>) => api.patch<User>("/users/me", data),
    onSuccess: (updatedUser) => {
      // Update cache
      queryClient.setQueryData(queryKeys.users.me(), updatedUser);
      toast.success("Profile updated");
    },
    onError: (error) => {
      handleApiError(error, "Failed to update profile");
    },
  });
}

// ===========================================
// Generic CRUD Hooks Factory
// ===========================================

interface CrudHooksConfig<T, CreateDTO, UpdateDTO> {
  baseKey: readonly string[];
  endpoint: string;
  entityName: string;
}

/**
 * Factory to create CRUD hooks for any resource
 */
export function createCrudHooks<
  T extends { id: string },
  CreateDTO = Omit<T, "id">,
  UpdateDTO = Partial<T>
>(config: CrudHooksConfig<T, CreateDTO, UpdateDTO>) {
  const { baseKey, endpoint, entityName } = config;

  // Helper to build URL with query params
  const buildUrl = (base: string, params?: Record<string, unknown>) => {
    if (!params || Object.keys(params).length === 0) return base;
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    });
    return `${base}?${searchParams.toString()}`;
  };

  return {
    // List all
    useList: (
      filters?: Record<string, unknown>,
      options?: Omit<UseQueryOptions<T[], Error>, "queryKey" | "queryFn">
    ) =>
      useQuery({
        queryKey: [...baseKey, "list", filters],
        queryFn: () => api.get<T[]>(buildUrl(endpoint, filters)),
        ...options,
      }),

    // Get by ID
    useById: (
      id: string,
      options?: Omit<UseQueryOptions<T, Error>, "queryKey" | "queryFn">
    ) =>
      useQuery({
        queryKey: [...baseKey, id],
        queryFn: () => api.get<T>(`${endpoint}/${id}`),
        enabled: !!id,
        ...options,
      }),

    // Create
    useCreate: (
      options?: Omit<UseMutationOptions<T, Error, CreateDTO>, "mutationFn">
    ) => {
      const queryClient = useQueryClient();
      return useMutation({
        mutationFn: (data: CreateDTO) =>
          api.post<T>(endpoint, data as Record<string, unknown>),
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: baseKey });
          toast.success(`${entityName} created`);
        },
        onError: (error) => {
          handleApiError(error, `Failed to create ${entityName.toLowerCase()}`);
        },
        ...options,
      });
    },

    // Update
    useUpdate: (
      options?: Omit<
        UseMutationOptions<T, Error, { id: string; data: UpdateDTO }>,
        "mutationFn"
      >
    ) => {
      const queryClient = useQueryClient();
      return useMutation({
        mutationFn: ({ id, data }: { id: string; data: UpdateDTO }) =>
          api.patch<T>(`${endpoint}/${id}`, data as Record<string, unknown>),
        onSuccess: (_, { id }) => {
          queryClient.invalidateQueries({ queryKey: [...baseKey, id] });
          queryClient.invalidateQueries({ queryKey: [...baseKey, "list"] });
          toast.success(`${entityName} updated`);
        },
        onError: (error) => {
          handleApiError(error, `Failed to update ${entityName.toLowerCase()}`);
        },
        ...options,
      });
    },

    // Delete
    useDelete: (
      options?: Omit<UseMutationOptions<void, Error, string>, "mutationFn">
    ) => {
      const queryClient = useQueryClient();
      return useMutation({
        mutationFn: (id: string) => api.delete<void>(`${endpoint}/${id}`),
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: baseKey });
          toast.success(`${entityName} deleted`);
        },
        onError: (error) => {
          handleApiError(error, `Failed to delete ${entityName.toLowerCase()}`);
        },
        ...options,
      });
    },
  };
}

// ===========================================
// Example: Posts CRUD hooks
// ===========================================

interface Post {
  id: string;
  title: string;
  content: string;
  authorId: string;
  createdAt: string;
}

export const postsApi = createCrudHooks<Post>({
  baseKey: queryKeys.posts.all,
  endpoint: "/posts",
  entityName: "Post",
});

// Usage:
// const { data: posts } = postsApi.useList();
// const { data: post } = postsApi.useById("123");
// const createPost = postsApi.useCreate();
// const updatePost = postsApi.useUpdate();
// const deletePost = postsApi.useDelete();
