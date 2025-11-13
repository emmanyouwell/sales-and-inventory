import { createContext, useContext, ReactNode } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { User } from "@shared/schema";

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
  isLoginPending: boolean;
  loginError: Error | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();

  // Get current user
  const { data: user, isLoading } = useQuery<User | null>({
    queryKey: ["/api/me"],
    queryFn: async () => {
      try {
        const response = await fetch("/api/me", { credentials: "include" });
        if (!response.ok) return null;
        return response.json();
      } catch {
        return null;
      }
    },
    staleTime: 5 * 60 * 1000,
  });

  // Login
  const loginMutation = useMutation({
    mutationFn: async ({ username, password }: { username: string; password: string }) => {
      const response = await apiRequest("POST", "/api/login", { username, password });
      if (!response.ok) {
        const errText = await response.text();
        throw new Error(errText || "Login failed");
      }
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["/api/me"], data.user);
    },
  });

  // Logout
  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/logout", {});
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/me"], null);
      queryClient.clear();
    },
  });

  const login = async (username: string, password: string) => {
    await loginMutation.mutateAsync({ username, password });
  };

  const logout = async () => {
    await logoutMutation.mutateAsync();
  };

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        login,
        logout,
        isLoading,
        isLoginPending: loginMutation.isPending,
        loginError: (loginMutation.error as Error) ?? null,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
  