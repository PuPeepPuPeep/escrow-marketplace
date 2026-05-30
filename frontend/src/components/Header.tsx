import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const home = user?.is_admin ? "/admin" : "/dashboard";

  return (
    <header className="bg-slate-900 text-white h-14 px-6 flex items-center justify-between shadow-lg">
      <button
        onClick={() => navigate(home)}
        className="font-bold text-lg tracking-tight hover:text-indigo-300 transition-colors"
      >
        Escrow
      </button>

      <div className="flex items-center gap-5 text-sm">
        <span className="text-slate-400 hidden sm:block">{user?.email}</span>

        {user && !user.is_admin && (
          <button
            onClick={() => navigate("/wallet")}
            className="text-slate-300 hover:text-white transition-colors"
          >
            Wallet
          </button>
        )}

        <button
          onClick={logout}
          className="text-slate-400 hover:text-red-400 transition-colors"
        >
          Logout
        </button>
      </div>
    </header>
  );
}
