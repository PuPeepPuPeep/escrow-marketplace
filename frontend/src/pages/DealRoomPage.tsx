import { useParams } from "react-router-dom";
import { useDealPolling } from "../hooks/useDealPolling";
import { useAuth } from "../context/AuthContext";
import { DealStatusBadge } from "../components/DealStatusBadge";
import { CountdownTimer } from "../components/CountdownTimer";
import { acceptDeal, cancelDeal, confirmDeal, payDeal } from "../api/deals";
import { useState } from "react";

export default function DealRoomPage() {
  const { token } = useParams<{ token: string }>();
  const { user } = useAuth();
  const { deal, error } = useDealPolling(token ?? null);
  const [actionError, setActionError] = useState("");
  const [slipUrl, setSlipUrl] = useState("");

  const handle = async (fn: () => Promise<unknown>) => {
    setActionError("");
    try {
      await fn();
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setActionError(msg ?? "Action failed");
    }
  };

  if (error) return <div className="p-8 text-red-600">{error}</div>;
  if (!deal) return <div className="p-8 text-gray-500">Loading deal...</div>;

  const isBuyer = user && deal.buyer_id === user.id;
  const isSeller = user && deal.seller_id === user.id;

  return (
    <div className="min-h-screen bg-gray-50 flex items-start justify-center pt-12 px-4">
      <div className="bg-white rounded-lg shadow max-w-lg w-full p-6 space-y-4">
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-bold">{deal.title}</h1>
          <DealStatusBadge status={deal.status} />
        </div>

        <div className="text-sm text-gray-600 space-y-1">
          <p><span className="font-medium">Amount:</span> ฿{deal.amount}</p>
          <p><span className="font-medium">GP Fee:</span> {deal.gp_fee_percent}%</p>
          <p><span className="font-medium">Lock duration:</span> {deal.lock_duration_minutes} min</p>
          {deal.expires_at && (
            <p><span className="font-medium">Time remaining:</span> <CountdownTimer expiresAt={deal.expires_at} /></p>
          )}
        </div>

        {actionError && <p className="text-red-600 text-sm">{actionError}</p>}

        <div className="space-y-2">
          {/* Buyer: accept deal */}
          {deal.status === "CREATED" && user && !isSeller && (
            <button
              onClick={() => handle(() => acceptDeal(deal.unique_token))}
              className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 font-semibold"
            >
              Accept Deal
            </button>
          )}

          {/* Buyer: pay */}
          {deal.status === "LOCKED" && isBuyer && (
            <div className="space-y-2">
              <input
                placeholder="Slip image URL (optional)"
                value={slipUrl}
                onChange={(e) => setSlipUrl(e.target.value)}
                className="w-full border rounded px-3 py-2 text-sm"
              />
              <button
                onClick={() => handle(() => payDeal(deal.id, slipUrl || undefined))}
                className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 font-semibold"
              >
                Submit Payment
              </button>
            </div>
          )}

          {/* Buyer: confirm receipt */}
          {deal.status === "PAID" && isBuyer && (
            <button
              onClick={() => handle(() => confirmDeal(deal.id))}
              className="w-full bg-green-700 text-white py-2 rounded hover:bg-green-800 font-semibold"
            >
              Confirm Receipt
            </button>
          )}

          {/* Seller/Admin: cancel */}
          {["CREATED", "LOCKED"].includes(deal.status) && (isSeller || user?.role === "admin") && (
            <button
              onClick={() => handle(() => cancelDeal(deal.id))}
              className="w-full border border-red-400 text-red-600 py-2 rounded hover:bg-red-50 font-semibold"
            >
              Cancel Deal
            </button>
          )}
        </div>

        {deal.status === "DONE" && (
          <p className="text-green-700 font-semibold text-center">Deal completed! Payment released to seller.</p>
        )}
      </div>
    </div>
  );
}
