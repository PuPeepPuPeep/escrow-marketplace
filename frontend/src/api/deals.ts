import api from "./client";
import type { Deal } from "../types";

export const createDeal = (title: string, amount: string, lock_duration_minutes = 30) =>
  api.post<Deal>("/deals", { title, amount, lock_duration_minutes });

export const getDeal = (token: string) =>
  api.get<Deal>(`/deals/${token}`);

export const acceptDeal = (token: string) =>
  api.post<Deal>(`/deals/${token}/accept`);

export const payDeal = (dealId: number, slip_image_url?: string, force_result?: string) =>
  api.post<Deal>(`/deals/${dealId}/pay`, { slip_image_url, force_result });

export const confirmDeal = (dealId: number) =>
  api.post<Deal>(`/deals/${dealId}/confirm`);

export const cancelDeal = (dealId: number) =>
  api.post<Deal>(`/deals/${dealId}/cancel`);
