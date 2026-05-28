import { useEffect, useState } from "react";

function formatSeconds(s: number): string {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

export function CountdownTimer({ expiresAt }: { expiresAt: string | null }) {
  const [remaining, setRemaining] = useState<number>(0);

  useEffect(() => {
    if (!expiresAt) return;

    const calc = () => {
      const diff = Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000));
      setRemaining(diff);
    };
    calc();
    const id = setInterval(calc, 1000);
    return () => clearInterval(id);
  }, [expiresAt]);

  if (!expiresAt) return null;

  return (
    <span className={`font-mono text-lg font-bold ${remaining === 0 ? "text-red-600" : "text-yellow-700"}`}>
      {remaining === 0 ? "EXPIRED" : formatSeconds(remaining)}
    </span>
  );
}
