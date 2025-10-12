import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  url: string,
  options?: {
    method?: string;
    body?: string;
    headers?: Record<string, string>;
  },
): Promise<Response> {
  const res = await fetch(url, {
    method: options?.method || 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    body: options?.body,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey[0] as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      // Global defaults optimized for performance
      refetchInterval: false, // No automatic polling by default
      refetchOnWindowFocus: false, // Don't refetch when window regains focus by default
      refetchOnMount: true, // Refetch on mount only if stale
      refetchOnReconnect: 'always', // Refetch when reconnecting
      staleTime: 10 * 60 * 1000, // 10 minutes - data is considered fresh for 10 minutes
      gcTime: 30 * 60 * 1000, // 30 minutes - keep cache for 30 minutes (increased for better performance)
      retry: (failureCount, error) => {
        // Don't retry on 4xx client errors
        if (error.message.match(/4\d{2}/)) {
          return false;
        }
        // Retry only once for server errors
        return failureCount < 1;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 3000), // Max 3 seconds
      networkMode: 'offlineFirst', // Prefer cached data when offline
    },
    mutations: {
      retry: false, // Don't retry mutations - fail fast
      networkMode: 'offlineFirst', // Allow mutations to be queued when offline
      onError: (error: Error) => {
        // Global error handler for mutations
        if (error.message.includes('401')) {
          // Handle unauthorized globally
          window.location.href = '/login';
        }
      },
    },
  },
});
