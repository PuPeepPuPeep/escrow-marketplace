import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createDeal } from "../api/deals";
import { useAuth } from "../context/AuthContext";

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [duration, setDuration] = useState(30);
  const [dealLink, setDealLink] = useState("");
  const [error, setError] = useState("");
  const [token, setToken] = useState("");

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const res = await createDeal(title, amount, duration);
      const t = res.data.unique_token;
      setToken(t);
      setDealLink(`${window.location.origin}/deal/${t}`);
    } catch {
      setError("Failed to create deal");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b px-6 py-3 flex justify-between items-center">
        <span className="font-bold text-lg">Escrow Marketplace</span>
        <div className="flex gap-4 items-center">
          <span className="text-sm text-gray-500">{user?.email} ({user?.role})</span>
          {user?.role === "seller" && (
            <button onClick={() => navigate("/wallet")} className="text-sm text-blue-600 hover:underline">Wallet</button>
          )}
          {user?.role === "admin" && (
            <button onClick={() => navigate("/admin")} className="text-sm text-purple-600 hover:underline">Admin</button>
          )}
          <button onClick={logout} className="text-sm text-red-500 hover:underline">Logout</button>
        </div>
      </nav>

      <main className="max-w-xl mx-auto mt-10 px-4">
        {user?.role === "seller" || user?.role === "admin" ? (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Create New Deal</h2>
            {error && <p className="text-red-600 text-sm mb-2">{error}</p>}
            <form onSubmit={handleCreate} className="space-y-3">
              <input
                placeholder="Deal title" value={title} onChange={(e) => setTitle(e.target.value)}
                className="w-full border rounded px-3 py-2 text-sm" required
              />
              <input
                placeholder="Amount (THB)" type="number" min="1" value={amount} onChange={(e) => setAmount(e.target.value)}
                className="w-full border rounded px-3 py-2 text-sm" required
              />
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600 whitespace-nowrap">Lock duration (min):</label>
                <input
                  type="number" min="5" max="60" value={duration} onChange={(e) => setDuration(Number(e.target.value))}
                  className="w-24 border rounded px-3 py-2 text-sm"
                />
              </div>
              <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 font-semibold">
                Create Deal
              </button>
            </form>

            {dealLink && (
              <div className="mt-4 p-3 bg-green-50 rounded border border-green-200">
                <p className="text-sm font-semibold text-green-800 mb-1">Deal created! Share this link with the buyer:</p>
                <a href={`/deal/${token}`} className="text-blue-600 text-sm break-all hover:underline">{dealLink}</a>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <p className="text-gray-600">Enter a deal link shared by the seller to get started.</p>
          </div>
        )}
      </main>
    </div>
  );
}
