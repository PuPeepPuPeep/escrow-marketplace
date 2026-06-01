import { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { login, getMe } from "../api/auth";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";

export default function LoginPage() {
  const { setToken } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const token = await login(email, password);
      setToken(token);
      const meRes = await getMe();
      const redirectTo = searchParams.get("redirect");
      navigate(redirectTo ?? (meRes.data.is_admin ? "/admin" : "/dashboard"));
    } catch {
      setError(t("auth", "invalidCredentials"));
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-indigo-900">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-sm space-y-4"
      >
        <div className="text-center mb-2">
          <h1 className="text-2xl font-bold text-slate-800">Escrow</h1>
          <p className="text-sm text-slate-500 mt-1">{t("auth", "signInSubtitle")}</p>
        </div>
        {error && (
          <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {error}
          </p>
        )}
        <input
          type="email"
          placeholder={t("auth", "email")}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border border-slate-300 rounded-lg px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-indigo-400"
          required
        />
        <input
          type="password"
          placeholder={t("auth", "password")}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full border border-slate-300 rounded-lg px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-indigo-400"
          required
        />
        <button
          type="submit"
          className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 font-semibold transition-colors"
        >
          {t("auth", "signIn")}
        </button>
        <p className="text-sm text-center text-slate-500">
          {t("auth", "noAccount")}{" "}
          <Link to="/register" className="text-indigo-600 hover:underline font-medium">
            {t("auth", "register")}
          </Link>
        </p>
      </form>
    </div>
  );
}
