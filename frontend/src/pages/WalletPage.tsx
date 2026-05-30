import { useEffect, useState } from "react";
import { getWallet, requestWithdrawal } from "../api/wallet";
import Header from "../components/Header";
import type { Wallet } from "../types";

export default function WalletPage() {
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [error, setError] = useState("");
  const [amount, setAmount] = useState("");
  const [bankAccount, setBankAccount] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountName, setAccountName] = useState("");
  const [withdrawError, setWithdrawError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    getWallet()
      .then((r) => setWallet(r.data))
      .catch(() => setError("Failed to load wallet"));
  }, []);

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    setWithdrawError("");
    setSuccess("");
    try {
      await requestWithdrawal(amount, bankAccount, bankName, accountName);
      setSuccess("Withdrawal request submitted");
      const r = await getWallet();
      setWallet(r.data);
      setAmount("");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setWithdrawError(msg ?? "Withdrawal failed");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />

      <main className="max-w-2xl mx-auto mt-8 px-4 space-y-6 pb-12">
        {error && <p className="text-red-600">{error}</p>}

        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
          <h2 className="text-sm font-medium text-slate-500 mb-1">Available Balance</h2>
          <p className="text-4xl font-bold text-emerald-600">฿{wallet?.balance ?? "—"}</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Request Withdrawal</h2>
          {withdrawError && (
            <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-3">
              {withdrawError}
            </p>
          )}
          {success && (
            <p className="text-emerald-700 text-sm bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2 mb-3">
              {success}
            </p>
          )}
          <form onSubmit={handleWithdraw} className="space-y-3">
            <input
              placeholder="Amount (THB)"
              type="number"
              min="1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              required
            />
            <input
              placeholder="Bank account number"
              value={bankAccount}
              onChange={(e) => setBankAccount(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              required
            />
            <input
              placeholder="Bank name"
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              required
            />
            <input
              placeholder="Account name"
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              required
            />
            <button
              type="submit"
              className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 font-semibold transition-colors"
            >
              Submit Withdrawal
            </button>
          </form>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Transaction History</h2>
          {!wallet?.transactions?.length ? (
            <p className="text-slate-400 text-sm">No transactions yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500 border-b border-slate-100">
                  <th className="pb-2 font-medium">Type</th>
                  <th className="pb-2 font-medium">Amount</th>
                  <th className="pb-2 font-medium">Balance After</th>
                  <th className="pb-2 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {wallet.transactions.map((t) => (
                  <tr key={t.id} className="border-b border-slate-50 last:border-0">
                    <td className="py-2 font-medium">{t.type}</td>
                    <td className="py-2">฿{t.amount}</td>
                    <td className="py-2">฿{t.balance_after}</td>
                    <td className="py-2 text-slate-400">{new Date(t.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  );
}
