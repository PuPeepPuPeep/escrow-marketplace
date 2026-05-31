import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createDeal, cancelDeal, getMyDeals } from "../api/deals";
import Header from "../components/Header";
import Pagination from "../components/Pagination";
import { DealStatusBadge } from "../components/DealStatusBadge";
import type { Deal } from "../types";

const PER_PAGE = 10;

export default function DashboardPage() {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [duration, setDuration] = useState(30);
  const [dealLink, setDealLink] = useState("");
  const [createError, setCreateError] = useState("");
  const [myDeals, setMyDeals] = useState<Deal[]>([]);
  const [dealsError, setDealsError] = useState("");
  const [dealsPage, setDealsPage] = useState(1);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyToClipboard = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const loadMyDeals = () => {
    getMyDeals()
      .then((r) => setMyDeals(r.data))
      .catch(() => setDealsError("Failed to load your deals"));
  };

  useEffect(() => { loadMyDeals(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError("");
    try {
      const res = await createDeal(title, amount, duration);
      const t = res.data.unique_token;
      setDealLink(`${window.location.origin}/deal/${t}`);
      setTitle("");
      setAmount("");
      loadMyDeals();
    } catch {
      setCreateError("Failed to create deal");
    }
  };

  const handleCancel = async (id: number) => {
    try {
      await cancelDeal(id);
      loadMyDeals();
    } catch {
      alert("Failed to cancel deal");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />

      <main className="max-w-2xl mx-auto mt-8 px-4 space-y-6 pb-12">
        {/* Create Deal */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Create New Deal</h2>
          {createError && (
            <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-3">
              {createError}
            </p>
          )}
          <form onSubmit={handleCreate} className="space-y-3">
            <input
              placeholder="Deal title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              required
            />
            <input
              placeholder="Amount (THB)"
              type="number"
              min="1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              required
            />
            <div className="flex items-center gap-2">
              <label className="text-sm text-slate-600 whitespace-nowrap">Lock duration (min):</label>
              <input
                type="number"
                min="5"
                max="60"
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="w-24 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 font-semibold transition-colors"
            >
              Create Deal
            </button>
          </form>

          {dealLink && (
            <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200 space-y-2">
              <p className="text-sm font-semibold text-green-800">
                Deal created! Share this link with the buyer:
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigate(`/deal/${dealLink.split("/deal/")[1]}`)}
                  className="text-indigo-600 text-sm break-all hover:underline text-left flex-1 min-w-0 truncate"
                >
                  {dealLink}
                </button>
                <button
                  onClick={() => copyToClipboard(dealLink, "new")}
                  className="flex-shrink-0 text-xs px-3 py-1.5 rounded-lg border border-green-300 text-green-700 hover:bg-green-100 transition-colors font-medium"
                >
                  {copiedId === "new" ? "✓ Copied!" : "Copy"}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* My Deals */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-800">My Deals</h2>
            {myDeals.length > 0 && (
              <span className="text-xs text-slate-400">{myDeals.length} total</span>
            )}
          </div>
          {dealsError && <p className="text-red-600 text-sm">{dealsError}</p>}
          {myDeals.length === 0 ? (
            <p className="text-slate-400 text-sm">No deals yet. Create one above.</p>
          ) : (() => {
            const totalPages = Math.ceil(myDeals.length / PER_PAGE);
            const slice = myDeals.slice((dealsPage - 1) * PER_PAGE, dealsPage * PER_PAGE);
            return (
              <>
                <div className="space-y-3">
                  {slice.map((deal) => (
                    <div
                      key={deal.id}
                      className="flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:bg-slate-50 transition-colors"
                    >
                      <div className="min-w-0 flex-1">
                        <button
                          onClick={() => navigate(`/deal/${deal.unique_token}`)}
                          className="font-medium text-slate-800 hover:text-indigo-600 text-sm truncate block"
                        >
                          {deal.title}
                        </button>
                        <p className="text-xs text-slate-400 mt-0.5">
                          ฿{deal.amount} · {new Date(deal.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 ml-3 flex-shrink-0">
                        <DealStatusBadge status={deal.status} />
                        <button
                          onClick={() => copyToClipboard(`${window.location.origin}/deal/${deal.unique_token}`, String(deal.id))}
                          className="text-xs text-slate-400 hover:text-slate-600 border border-slate-200 rounded px-2 py-1 hover:bg-slate-50 transition-colors"
                          title="Copy deal link"
                        >
                          {copiedId === String(deal.id) ? "✓" : "Copy"}
                        </button>
                        {deal.status === "CREATED" && (
                          <button
                            onClick={() => handleCancel(deal.id)}
                            className="text-xs text-red-500 hover:text-red-700 border border-red-200 rounded px-2 py-1 hover:bg-red-50 transition-colors"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <Pagination page={dealsPage} totalPages={totalPages} onChange={setDealsPage} />
              </>
            );
          })()}
        </div>
      </main>
    </div>
  );
}
