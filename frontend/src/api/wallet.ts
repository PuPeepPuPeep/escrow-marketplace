import api from "./client";
import type { Wallet, Withdrawal } from "../types";

export const getWallet = () => api.get<Wallet>("/wallet");

export const requestWithdrawal = (amount: string, bank_account: string, bank_name: string, account_name: string) =>
  api.post<Withdrawal>("/wallet/withdraw", { amount, bank_account, bank_name, account_name });
