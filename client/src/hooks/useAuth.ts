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
  trialExpired?: boolean;
  trialDaysRemaining?: number;
}

// Response type from auth endpoint
interface AuthResponse {
  user: AuthUser | null;
  isAuthenticated: boolean;
}

export function useAuth() {
  const { data, isLoading, error } = useQuery<AuthUser | AuthResponse | null>({
    queryKey: ["/api/auth/user"],
    retry: false,
    retryOnMount: false,
    staleTime: 0,
    refetchOnWindowFocus: false,
    gcTime: 0,
  });

  // Handle both old format (user object directly) and new format ({ user, isAuthenticated })
  const user = data && 'isAuthenticated' in data ? data.user : (data as AuthUser | null);
  const isAuthenticated = !!user && !error;

  return {
    user,
    isLoading,
    isAuthenticated,
    error,
  };
}
