import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { adminExportWithdrawals, adminGetStats, adminGetWithdrawals, adminMarkPayout } from "../../api/admin";

interface Stats {
  total_deals: number;
  total_volume: string;
  total_fees_collected: string;
  pending_withdrawals: number;
  pending_withdrawal_amount: string;
}

interface WithdrawalRow {
  id: number;
  amount: string;
  status: string;
  bank_account: string;
  bank_name: string;
  account_name: string;
  requested_at: string;
}

export default function AdminPage() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats | null>(null);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRow[]>([]);
  const [error, setError] = useState("");

  const loadData = () => {
    adminGetStats().then((r) => setStats(r.data)).catch(() => setError("Failed to load stats"));
    adminGetWithdrawals("QUEUED").then((r) => setWithdrawals(r.data)).catch(() => {});
  };

  useEffect(() => { loadData(); }, []);

  const handlePayout = async (id: number) => {
    await adminMarkPayout(id);
    loadData();
  };

  const handleExport = async () => {
    const res = await adminExportWithdrawals();
    const url = URL.createObjectURL(res.data);
    const a = document.createElement("a");
    a.href = url;
    a.download = "withdrawals.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b px-6 py-3 flex justify-between items-center">
        <button onClick={() => navigate("/dashboard")} className="text-blue-600 hover:underline text-sm">← Dashboard</button>
        <span className="font-bold">Admin Panel</span>
        <span />
      </nav>

      <main className="max-w-4xl mx-auto mt-8 px-4 space-y-6">
        {error && <p className="text-red-600">{error}</p>}

        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Total Deals", value: stats.total_deals },
              { label: "Volume (Done)", value: `฿${stats.total_volume}` },
              { label: "Fees Collected", value: `฿${stats.total_fees_collected}` },
              { label: "Pending Withdrawals", value: `${stats.pending_withdrawals} (฿${stats.pending_withdrawal_amount})` },
            ].map(({ label, value }) => (
              <div key={label} className="bg-white rounded-lg shadow p-4">
                <p className="text-xs text-gray-500">{label}</p>
                <p className="text-xl font-bold">{value}</p>
              </div>
            ))}
          </div>
        )}

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Pending Withdrawals</h2>
            <button onClick={handleExport} className="text-sm bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700">
              Export CSV
            </button>
          </div>
          {withdrawals.length === 0 ? (
            <p className="text-gray-400 text-sm">No pending withdrawals.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b">
                  <th className="pb-2">ID</th>
                  <th className="pb-2">Amount</th>
                  <th className="pb-2">Bank</th>
                  <th className="pb-2">Account</th>
                  <th className="pb-2">Requested</th>
                  <th className="pb-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {withdrawals.map((w) => (
                  <tr key={w.id} className="border-b last:border-0">
                    <td className="py-2">{w.id}</td>
                    <td className="py-2">฿{w.amount}</td>
                    <td className="py-2">{w.bank_name}</td>
                    <td className="py-2">{w.bank_account} ({w.account_name})</td>
                    <td className="py-2 text-gray-400">{new Date(w.requested_at).toLocaleDateString()}</td>
                    <td className="py-2">
                      <button
                        onClick={() => handlePayout(w.id)}
                        className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700"
                      >
                        Mark Paid
                      </button>
                    </td>
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
