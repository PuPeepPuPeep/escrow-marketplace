import type { DealStatus } from "../types";

const colors: Record<DealStatus, string> = {
  CREATED: "bg-gray-100 text-gray-700",
  LOCKED: "bg-yellow-100 text-yellow-800",
  PAID: "bg-blue-100 text-blue-800",
  DONE: "bg-green-100 text-green-800",
  EXPIRED: "bg-red-100 text-red-700",
  CANCELLED: "bg-gray-200 text-gray-500",
  WITHDRAW_QUEUED: "bg-purple-100 text-purple-800",
  PAID_OUT: "bg-green-200 text-green-900",
};

export function DealStatusBadge({ status }: { status: DealStatus }) {
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${colors[status]}`}>
      {status}
    </span>
  );
}
