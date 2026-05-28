import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getWallet, requestWithdrawal } from "../api/wallet";
import type { Wallet } from "../types";

export default function WalletPage() {
  const navigate = useNavigate();
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
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b px-6 py-3 flex justify-between items-center">
        <button onClick={() => navigate("/dashboard")} className="text-blue-600 hover:underline text-sm">← Dashboard</button>
        <span className="font-bold">Wallet</span>
        <span />
      </nav>

      <main className="max-w-2xl mx-auto mt-8 px-4 space-y-6">
        {error && <p className="text-red-600">{error}</p>}

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-1">Balance</h2>
          <p className="text-3xl font-bold text-green-700">฿{wallet?.balance ?? "—"}</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Request Withdrawal</h2>
          {withdrawError && <p className="text-red-600 text-sm mb-2">{withdrawError}</p>}
          {success && <p className="text-green-700 text-sm mb-2">{success}</p>}
          <form onSubmit={handleWithdraw} className="space-y-3">
            <input placeholder="Amount (THB)" type="number" min="1" value={amount} onChange={(e) => setAmount(e.target.value)}
              className="w-full border rounded px-3 py-2 text-sm" required />
            <input placeholder="Bank account number" value={bankAccount} onChange={(e) => setBankAccount(e.target.value)}
              className="w-full border rounded px-3 py-2 text-sm" required />
            <input placeholder="Bank name" value={bankName} onChange={(e) => setBankName(e.target.value)}
              className="w-full border rounded px-3 py-2 text-sm" required />
            <input placeholder="Account name" value={accountName} onChange={(e) => setAccountName(e.target.value)}
              className="w-full border rounded px-3 py-2 text-sm" required />
            <button type="submit" className="w-full bg-purple-600 text-white py-2 rounded hover:bg-purple-700 font-semibold">
              Submit Withdrawal
            </button>
          </form>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Transaction History</h2>
          {!wallet?.transactions?.length ? (
            <p className="text-gray-400 text-sm">No transactions yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b">
                  <th className="pb-2">Type</th>
                  <th className="pb-2">Amount</th>
                  <th className="pb-2">Balance After</th>
                  <th className="pb-2">Date</th>
                </tr>
              </thead>
              <tbody>
                {wallet.transactions.map((t) => (
                  <tr key={t.id} className="border-b last:border-0">
                    <td className="py-2">{t.type}</td>
                    <td className="py-2">฿{t.amount}</td>
                    <td className="py-2">฿{t.balance_after}</td>
                    <td className="py-2 text-gray-400">{new Date(t.created_at).toLocaleDateString()}</td>
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
