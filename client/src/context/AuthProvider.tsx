import { createContext, useContext, ReactNode } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { BASE_API_URL } from "@/api";
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

  // Fetch current user
  const { data: user, isLoading } = useQuery<User | null>({
    queryKey: ["/api/me"],
    queryFn: async () => {
      try {
        const response = await fetch(`${BASE_API_URL}/api/me`, {
          credentials: "include",
        });
        if (!response.ok) return null;
        const data = await response.json();
        return data.user ?? null; // ✅ extract user object
      } catch {
        return null;
      }
    },
    staleTime: 5 * 60 * 1000,
  });

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async ({ username, password }: { username: string; password: string }) => {
      const res = await fetch(`${BASE_API_URL}/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Login failed");
      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["/api/me"], data.user);
    },
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      await fetch(`${BASE_API_URL}/api/logout`, {
        method: "POST",
        credentials: "include",
      });
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/me"], null);
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
        isLoginPending: loginMutation.isPending, // ✅ fixed
        loginError: (loginMutation.error as Error) ?? null,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}
