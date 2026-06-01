import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { adminExportWithdrawals, adminGetDeals, adminGetStats, adminGetWithdrawals, adminMarkPayout } from "../../api/admin";
import Header from "../../components/Header";
import Pagination from "../../components/Pagination";
import { DealStatusBadge } from "../../components/DealStatusBadge";
import { useLanguage } from "../../context/LanguageContext";
import type { Deal } from "../../types";

const PER_PAGE = 10;

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
  const { t } = useLanguage();
  const [stats, setStats] = useState<Stats | null>(null);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRow[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [dealsPage, setDealsPage] = useState(1);
  const [error, setError] = useState("");

  const loadData = () => {
    adminGetStats().then((r) => setStats(r.data)).catch(() => setError(t("admin", "failedStats")));
    adminGetWithdrawals("QUEUED").then((r) => setWithdrawals(r.data)).catch(() => {});
    adminGetDeals().then((r) => setDeals(r.data)).catch(() => {});
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
    <div className="min-h-screen bg-slate-50">
      <Header />

      <main className="max-w-5xl mx-auto mt-8 px-4 space-y-6 pb-12">
        {error && <p className="text-red-600">{error}</p>}

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: t("admin", "statTotalDeals"), value: stats.total_deals },
              { label: t("admin", "statVolume"), value: `฿${stats.total_volume}` },
              { label: t("admin", "statFees"), value: `฿${stats.total_fees_collected}` },
              { label: t("admin", "statPendingWithdrawals"), value: `${stats.pending_withdrawals} (฿${stats.pending_withdrawal_amount})` },
            ].map(({ label, value }) => (
              <div key={label} className="bg-white rounded-xl shadow-sm border border-slate-100 p-4">
                <p className="text-xs text-slate-500">{label}</p>
                <p className="text-xl font-bold text-slate-800 mt-1">{value}</p>
              </div>
            ))}
          </div>
        )}

        {/* All Deals */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-800">{t("admin", "allDeals")}</h2>
            {deals.length > 0 && (
              <span className="text-xs text-slate-400">{deals.length} {t("common", "total")}</span>
            )}
          </div>
          {deals.length === 0 ? (
            <p className="text-slate-400 text-sm">{t("admin", "noDeals")}</p>
          ) : (() => {
            const totalPages = Math.ceil(deals.length / PER_PAGE);
            const slice = deals.slice((dealsPage - 1) * PER_PAGE, dealsPage * PER_PAGE);
            return (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-slate-500 border-b border-slate-100">
                        <th className="pb-2 font-medium">{t("admin", "colId")}</th>
                        <th className="pb-2 font-medium">{t("admin", "colTitle")}</th>
                        <th className="pb-2 font-medium">{t("admin", "colAmount")}</th>
                        <th className="pb-2 font-medium">{t("admin", "colStatus")}</th>
                        <th className="pb-2 font-medium">{t("admin", "colSeller")}</th>
                        <th className="pb-2 font-medium">{t("admin", "colBuyer")}</th>
                        <th className="pb-2 font-medium">{t("admin", "colCreated")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {slice.map((d) => (
                        <tr key={d.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50">
                          <td className="py-2 text-slate-400">{d.id}</td>
                          <td className="py-2">
                            <button
                              onClick={() => navigate(`/deal/${d.unique_token}`)}
                              className="font-medium text-indigo-600 hover:underline text-left"
                            >
                              {d.title}
                            </button>
                          </td>
                          <td className="py-2">฿{d.amount}</td>
                          <td className="py-2"><DealStatusBadge status={d.status} /></td>
                          <td className="py-2 text-slate-400">{d.seller_id}</td>
                          <td className="py-2 text-slate-400">{d.buyer_id ?? "—"}</td>
                          <td className="py-2 text-slate-400">{new Date(d.created_at).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <Pagination page={dealsPage} totalPages={totalPages} onChange={setDealsPage} />
              </>
            );
          })()}
        </div>

        {/* Pending Withdrawals */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-slate-800">{t("admin", "pendingWithdrawals")}</h2>
            <button
              onClick={handleExport}
              className="text-sm bg-emerald-600 text-white px-3 py-1.5 rounded-lg hover:bg-emerald-700 transition-colors"
            >
              {t("admin", "exportCsv")}
            </button>
          </div>
          {withdrawals.length === 0 ? (
            <p className="text-slate-400 text-sm">{t("admin", "noPendingWithdrawals")}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-500 border-b border-slate-100">
                    <th className="pb-2 font-medium">{t("admin", "colId")}</th>
                    <th className="pb-2 font-medium">{t("admin", "colAmount")}</th>
                    <th className="pb-2 font-medium">{t("admin", "colBank")}</th>
                    <th className="pb-2 font-medium">{t("admin", "colAccount")}</th>
                    <th className="pb-2 font-medium">{t("admin", "colRequested")}</th>
                    <th className="pb-2 font-medium">{t("admin", "colAction")}</th>
                  </tr>
                </thead>
                <tbody>
                  {withdrawals.map((w) => (
                    <tr key={w.id} className="border-b border-slate-50 last:border-0">
                      <td className="py-2 text-slate-400">{w.id}</td>
                      <td className="py-2">฿{w.amount}</td>
                      <td className="py-2">{w.bank_name}</td>
                      <td className="py-2">{w.bank_account} ({w.account_name})</td>
                      <td className="py-2 text-slate-400">{new Date(w.requested_at).toLocaleDateString()}</td>
                      <td className="py-2">
                        <button
                          onClick={() => handlePayout(w.id)}
                          className="text-xs bg-indigo-600 text-white px-2 py-1 rounded hover:bg-indigo-700 transition-colors"
                        >
                          {t("admin", "markPaid")}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
