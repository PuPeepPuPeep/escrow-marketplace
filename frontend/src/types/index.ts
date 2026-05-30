export interface User {
  id: number;
  email: string;
  is_admin: boolean;
}

export type DealStatus =
  | "CREATED"
  | "LOCKED"
  | "PAID"
  | "DONE"
  | "EXPIRED"
  | "CANCELLED"
  | "WITHDRAW_QUEUED"
  | "PAID_OUT";

export interface Deal {
  id: number;
  title: string;
  amount: string;
  gp_fee_percent: string;
  status: DealStatus;
  unique_token: string;
  lock_duration_minutes: number;
  locked_at: string | null;
  expires_at: string | null;
  seller_id: number;
  buyer_id: number | null;
  created_at: string;
}

export interface WalletTransaction {
  id: number;
  type: "CREDIT" | "DEBIT" | "WITHDRAW";
  amount: string;
  balance_after: string;
  created_at: string;
}

export interface Wallet {
  id: number;
  balance: string;
  transactions: WalletTransaction[];
}

export interface Withdrawal {
  id: number;
  amount: string;
  status: "QUEUED" | "PAID_OUT";
  bank_account: string;
  requested_at: string;
  paid_out_at: string | null;
}
