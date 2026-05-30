import api from "./client";
import type { User } from "../types";

export const register = (email: string, password: string) =>
  api.post<{ id: number; email: string; is_admin: boolean }>("/auth/register", { email, password });

export const login = async (email: string, password: string): Promise<string> => {
  const res = await api.post<{ access_token: string }>("/auth/login", { email, password });
  return res.data.access_token;
};

export const getMe = () => api.get<User>("/auth/me");
