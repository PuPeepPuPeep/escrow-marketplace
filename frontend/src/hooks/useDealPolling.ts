import { useEffect, useState } from "react";
import { getDeal } from "../api/deals";
import type { Deal } from "../types";

export function useDealPolling(token: string | null, intervalMs = 5000) {
  const [deal, setDeal] = useState<Deal | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;

    const fetch = () =>
      getDeal(token)
        .then((res) => setDeal(res.data))
        .catch((e) => setError(e?.response?.data?.detail ?? "Failed to load deal"));

    fetch();
    const id = setInterval(fetch, intervalMs);
    return () => clearInterval(id);
  }, [token, intervalMs]);

  return { deal, error };
}
