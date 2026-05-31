import api from "./client";

export interface EscrowAccount {
  bank_name: string;
  account_number: string;
  account_name: string;
}

export const getEscrowAccount = () =>
  api.get<EscrowAccount>("/mock/escrow-account");
