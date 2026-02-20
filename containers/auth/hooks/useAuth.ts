"use client";

import useSWR from "swr";
import { useRouter } from "next/navigation";
import { useCallback } from "react";
import type { AuthUser } from "@/types/user";

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) return { user: null };
  return res.json();
};

export function useAuth() {
  const router = useRouter();
  const { data, error, isLoading, mutate } = useSWR<{ user: AuthUser | null }>(
    "/api/auth/me",
    fetcher,
    {
      revalidateOnFocus: false,
      shouldRetryOnError: false,
    }
  );

  const login = useCallback(
    async (email: string, password: string) => {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || "Erro ao fazer login");
      }

      await mutate({ user: json.user }, false);
      return json.user as AuthUser;
    },
    [mutate]
  );

  const logout = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    await mutate({ user: null }, false);
    router.push("/login");
  }, [mutate, router]);

  return {
    user: data?.user ?? null,
    isLoading,
    isError: !!error,
    isAuthenticated: !!data?.user,
    login,
    logout,
    mutate,
  };
}
