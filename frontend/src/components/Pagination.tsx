interface PaginationProps {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}

export default function Pagination({ page, totalPages, onChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages: (number | "…")[] = [];

  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (page > 3) pages.push("…");
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) {
      pages.push(i);
    }
    if (page < totalPages - 2) pages.push("…");
    pages.push(totalPages);
  }

  const btn = (
    label: string | number,
    target: number,
    active = false,
    disabled = false
  ) => (
    <button
      key={`${label}-${target}`}
      onClick={() => !disabled && onChange(target)}
      disabled={disabled}
      className={[
        "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
        active
          ? "bg-indigo-600 text-white"
          : disabled
          ? "text-slate-300 cursor-not-allowed"
          : "text-slate-600 hover:bg-slate-100",
      ].join(" ")}
    >
      {label}
    </button>
  );

  return (
    <div className="flex items-center justify-center gap-1 mt-4">
      {btn("←", page - 1, false, page === 1)}
      {pages.map((p, i) =>
        p === "…" ? (
          <span key={`ellipsis-${i}`} className="px-2 text-slate-400 text-sm">…</span>
        ) : (
          btn(p, p as number, p === page)
        )
      )}
      {btn("→", page + 1, false, page === totalPages)}
    </div>
  );
}
