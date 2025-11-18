import { useQuery } from "@tanstack/react-query";
import type { User } from "@shared/schema";

// Extended user type with additional fields from the auth endpoint
export interface AuthUser extends User {
  organizationId?: number;
  organizationName?: string;
  coachName?: string;
  coachEmail?: string;
  coachId?: string;
  ownerId?: string;
  assignedCoachId?: string;
  organizationLogo?: string;
  role?: 'coach' | 'client';
  hasPersonalPassword?: boolean;
}

export function useAuth() {
  const { data: user, isLoading, error } = useQuery<AuthUser | null>({
    queryKey: ["/api/auth/user"],
    retry: false,
    retryOnMount: false,
    staleTime: 0,
    refetchOnWindowFocus: false,
    gcTime: 0,
  });

  // Don't treat 401 errors as loading states
  const isActuallyLoading = isLoading && !error;
  const isAuthenticated = !!user && !error;

  return {
    user,
    isLoading: isActuallyLoading,
    isAuthenticated,
    error,
  };
}
