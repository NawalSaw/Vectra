import { useQuery } from "@tanstack/react-query"
import { useEffect } from "react";

import { API_BASE_URL, API_ENDPOINTS } from '@/lib/api-config';
import { ApiError, type CurrentUser } from "@/lib/api-types";
import { useUserStore } from "@/lib/user-store";

// Base API client
async function apiRequest<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const errorData: ApiError = await response.json().catch(() => ({
      message: 'An error occurred',
      status: response.status,
    }));
    throw new Error(errorData.message || 'API request failed');
  }

  return response.json();
}

export const useCurrentUser = (userId: string) => {
  const setUser = useUserStore((state) => state.setUser);
  const setClerkUserId = useUserStore((state) => state.setClerkUserId);
  const setLoading = useUserStore((state) => state.setLoading);
  const setError = useUserStore((state) => state.setError);
  const clearUser = useUserStore((state) => state.clearUser);

  const query = useQuery<CurrentUser>({
    queryKey: ["current-user", userId],
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: 1,
    queryFn: () =>
      apiRequest<CurrentUser>(
        `${API_ENDPOINTS.GET_CURRENT_USER}?clerk_user_id=${userId}`
      ),
});

  useEffect(() => {
    if (!userId) {
      clearUser();
      return;
    }

    setClerkUserId(userId);
  }, [clearUser, setClerkUserId, userId]);

  useEffect(() => {
    setLoading(query.isLoading || query.isFetching);
  }, [query.isFetching, query.isLoading, setLoading]);

  useEffect(() => {
    if (query.data) {
      setUser(query.data);
    }
  }, [query.data, setUser]);

  useEffect(() => {
    setError(query.error instanceof Error ? query.error.message : null);
  }, [query.error, setError]);

  return query;
};
