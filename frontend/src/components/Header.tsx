import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";

export default function Header() {
  const { user, logout } = useAuth();
  const { t, lang, toggleLang } = useLanguage();
  const navigate = useNavigate();

  const home = user?.is_admin ? "/admin" : "/dashboard";

  return (
    <header className="bg-slate-900 text-white h-14 px-6 flex items-center justify-between shadow-lg">
      {/* Left: logo + nav links */}
      <div className="flex items-center gap-6">
        <button
          onClick={() => navigate(home)}
          className="font-bold text-lg tracking-tight hover:text-indigo-300 transition-colors"
        >
          Escrow
        </button>

        {user && (
          <nav className="flex items-center gap-4 text-sm">
            <button
              onClick={() => navigate(home)}
              className="text-slate-300 hover:text-white transition-colors"
            >
              {user.is_admin ? t("header", "admin") : t("header", "dashboard")}
            </button>
            {!user.is_admin && (
              <button
                onClick={() => navigate("/wallet")}
                className="text-slate-300 hover:text-white transition-colors"
              >
                {t("header", "wallet")}
              </button>
            )}
          </nav>
        )}
      </div>

      {/* Right: lang toggle + user info + logout */}
      <div className="flex items-center gap-4 text-sm">
        <button
          onClick={toggleLang}
          className="text-xs font-semibold px-2 py-1 rounded border border-slate-600 text-slate-300 hover:border-indigo-400 hover:text-white transition-colors"
        >
          {lang === "en" ? "TH" : "EN"}
        </button>

        {user ? (
          <>
            <span className="text-slate-400 hidden sm:block">{user.email}</span>
            <button
              onClick={() => { logout(); navigate("/login"); }}
              className="text-slate-400 hover:text-red-400 transition-colors"
            >
              {t("header", "logout")}
            </button>
          </>
        ) : (
          <a href="/login" className="text-slate-300 hover:text-white transition-colors">
            {t("header", "signIn")}
          </a>
        )}
      </div>
    </header>
  );
}
