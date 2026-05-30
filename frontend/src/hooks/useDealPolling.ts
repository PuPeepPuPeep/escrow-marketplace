import { useCallback, useEffect, useRef, useState } from "react";
import { getDeal } from "../api/deals";
import type { Deal } from "../types";

export function useDealPolling(token: string | null, intervalMs = 5000) {
  const [deal, setDeal] = useState<Deal | null>(null);
  const [error, setError] = useState<string | null>(null);
  const tokenRef = useRef(token);
  tokenRef.current = token;

  const fetchDeal = useCallback(() => {
    if (!tokenRef.current) return Promise.resolve();
    return getDeal(tokenRef.current)
      .then((res) => setDeal(res.data))
      .catch((e) => setError(e?.response?.data?.detail ?? "Failed to load deal"));
  }, []);

  useEffect(() => {
    if (!token) return;
    fetchDeal();
    const id = setInterval(fetchDeal, intervalMs);
    return () => clearInterval(id);
  }, [token, intervalMs, fetchDeal]);

  return { deal, error, refetch: fetchDeal };
}
