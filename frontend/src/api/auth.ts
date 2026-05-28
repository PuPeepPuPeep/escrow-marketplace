import api from "./client";
import type { User } from "../types";

export const register = (email: string, password: string, role: string) =>
  api.post<{ id: number; email: string; role: string }>("/auth/register", { email, password, role });

export const login = async (email: string, password: string): Promise<string> => {
  const res = await api.post<{ access_token: string }>("/auth/login", { email, password });
  return res.data.access_token;
};

export const getMe = () => api.get<User>("/auth/me");
