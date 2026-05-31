import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Header() {
  const { user, logout } = useAuth();
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
              {user.is_admin ? "Admin" : "Dashboard"}
            </button>
            {!user.is_admin && (
              <button
                onClick={() => navigate("/wallet")}
                className="text-slate-300 hover:text-white transition-colors"
              >
                Wallet
              </button>
            )}
          </nav>
        )}
      </div>

      {/* Right: user info + logout */}
      <div className="flex items-center gap-5 text-sm">
        {user ? (
          <>
            <span className="text-slate-400 hidden sm:block">{user.email}</span>
            <button
              onClick={() => { logout(); navigate("/login"); }}
              className="text-slate-400 hover:text-red-400 transition-colors"
            >
              Logout
            </button>
          </>
        ) : (
          <a href="/login" className="text-slate-300 hover:text-white transition-colors">
            Sign In
          </a>
        )}
      </div>
    </header>
  );
}
