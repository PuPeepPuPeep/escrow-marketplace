import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { useDealPolling } from "../hooks/useDealPolling";
import { useAuth } from "../context/AuthContext";
import { DealStatusBadge } from "../components/DealStatusBadge";
import { CountdownTimer } from "../components/CountdownTimer";
import Header from "../components/Header";
import { acceptDeal, cancelDeal, confirmDeal, payDeal } from "../api/deals";
import { getEscrowAccount, type EscrowAccount } from "../api/mock";

export default function DealRoomPage() {
  const { token } = useParams<{ token: string }>();
  const { user } = useAuth();
  const { deal, error, refetch } = useDealPolling(token ?? null);
  const [actionError, setActionError] = useState("");
  const [slipUrl, setSlipUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [escrowAccount, setEscrowAccount] = useState<EscrowAccount | null>(null);

  const isBuyerLocked = deal?.status === "LOCKED" && !!user && deal?.buyer_id === user.id;

  useEffect(() => {
    if (isBuyerLocked && !escrowAccount) {
      getEscrowAccount().then((r) => setEscrowAccount(r.data)).catch(() => {});
    }
  }, [isBuyerLocked]);

  const handle = async (fn: () => Promise<unknown>) => {
    setActionError("");
    setIsSubmitting(true);
    try {
      await fn();
      await refetch(); // update deal status immediately — don't wait for next poll
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setActionError(msg ?? "Action failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (error) return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <div className="p-8 text-red-600">{error}</div>
    </div>
  );

  if (!deal) return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <div className="p-8 text-slate-400">Loading deal…</div>
    </div>
  );

  const isBuyer = user && deal.buyer_id === user.id;
  const isSeller = user && deal.seller_id === user.id;
  const isAdmin = user?.is_admin;

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />

      <div className="flex items-start justify-center pt-10 px-4 pb-12">
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 max-w-lg w-full p-6 space-y-5">
          <div className="flex justify-between items-start gap-2">
            <h1 className="text-xl font-bold text-slate-800">{deal.title}</h1>
            <DealStatusBadge status={deal.status} />
          </div>

          <div className="text-sm text-slate-600 space-y-1.5 bg-slate-50 rounded-lg p-4">
            <p><span className="font-medium text-slate-700">Amount:</span> ฿{deal.amount}</p>
            <p><span className="font-medium text-slate-700">GP Fee:</span> {deal.gp_fee_percent}%</p>
            <p><span className="font-medium text-slate-700">Lock duration:</span> {deal.lock_duration_minutes} min</p>
            {deal.expires_at && (
              <p>
                <span className="font-medium text-slate-700">Time remaining:</span>{" "}
                <CountdownTimer expiresAt={deal.expires_at} />
              </p>
            )}
          </div>

          {actionError && (
            <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {actionError}
            </p>
          )}

          <div className="space-y-2">
            {/* Not logged in: prompt to login */}
            {deal.status === "CREATED" && !user && (
              <div className="text-center space-y-2 py-1">
                <p className="text-sm text-slate-500">Sign in to accept this deal</p>
                <div className="flex gap-2">
                  <a
                    href={`/login?redirect=/deal/${token}`}
                    className="flex-1 text-center bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 font-semibold transition-colors text-sm"
                  >
                    Sign In
                  </a>
                  <a
                    href={`/register?redirect=/deal/${token}`}
                    className="flex-1 text-center border border-indigo-300 text-indigo-600 py-2 rounded-lg hover:bg-indigo-50 font-semibold transition-colors text-sm"
                  >
                    Register
                  </a>
                </div>
              </div>
            )}

            {/* Buyer: accept deal */}
            {deal.status === "CREATED" && user && !isSeller && !isAdmin && (
              <button
                onClick={() => handle(() => acceptDeal(deal.unique_token))}
                disabled={isSubmitting}
                className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 font-semibold transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Processing…" : "Accept Deal"}
              </button>
            )}

            {/* Buyer: pay — show escrow account info + slip upload */}
            {deal.status === "LOCKED" && isBuyer && (
              <div className="space-y-3">
                {escrowAccount && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 space-y-1.5">
                    <p className="text-sm font-semibold text-amber-800 mb-2">
                      💳 Transfer to this account
                    </p>
                    <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
                      <span className="text-amber-700 font-medium">Bank</span>
                      <span className="text-amber-900">{escrowAccount.bank_name}</span>
                      <span className="text-amber-700 font-medium">Account</span>
                      <span className="text-amber-900 font-mono tracking-wide">{escrowAccount.account_number}</span>
                      <span className="text-amber-700 font-medium">Name</span>
                      <span className="text-amber-900">{escrowAccount.account_name}</span>
                      <span className="text-amber-700 font-medium">Amount</span>
                      <span className="text-amber-900 font-semibold">฿{deal.amount}</span>
                    </div>
                  </div>
                )}
                <input
                  placeholder="Slip image URL (optional)"
                  value={slipUrl}
                  onChange={(e) => setSlipUrl(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-indigo-400 disabled:opacity-60"
                />
                <button
                  onClick={() => handle(() => payDeal(deal.id, slipUrl || undefined))}
                  disabled={isSubmitting}
                  className="w-full bg-emerald-600 text-white py-2 rounded-lg hover:bg-emerald-700 font-semibold transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? "Processing…" : "Submit Payment"}
                </button>
              </div>
            )}

            {/* Buyer: confirm receipt */}
            {deal.status === "PAID" && isBuyer && (
              <button
                onClick={() => handle(() => confirmDeal(deal.id))}
                disabled={isSubmitting}
                className="w-full bg-emerald-700 text-white py-2 rounded-lg hover:bg-emerald-800 font-semibold transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Processing…" : "Confirm Receipt"}
              </button>
            )}

            {/* Seller or Admin: cancel */}
            {["CREATED", "LOCKED"].includes(deal.status) && (isSeller || isAdmin) && (
              <button
                onClick={() => handle(() => cancelDeal(deal.id))}
                disabled={isSubmitting}
                className="w-full border border-red-300 text-red-600 py-2 rounded-lg hover:bg-red-50 font-semibold transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Processing…" : "Cancel Deal"}
              </button>
            )}
          </div>

          {deal.status === "DONE" && (
            <p className="text-emerald-700 font-semibold text-center bg-emerald-50 rounded-lg py-3">
              Deal completed! Payment released to seller.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
