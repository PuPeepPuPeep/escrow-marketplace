import api from "./client";
import type { Deal } from "../types";

export const adminGetDeals = (skip = 0, limit = 50) =>
  api.get<Deal[]>("/admin/deals", { params: { skip, limit } });

export const adminGetStats = () =>
  api.get<{
    total_deals: number;
    total_volume: string;
    total_fees_collected: string;
    pending_withdrawals: number;
    pending_withdrawal_amount: string;
  }>("/admin/stats");

export const adminGetWithdrawals = (status?: string) =>
  api.get("/admin/withdrawals", { params: status ? { status } : undefined });

export const adminMarkPayout = (id: number) =>
  api.post(`/admin/withdrawals/${id}/payout`);

export const adminExportWithdrawals = () =>
  api.get("/admin/withdrawals/export", { responseType: "blob" });
