import { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { register, login, getMe } from "../api/auth";
import { useAuth } from "../context/AuthContext";

export default function RegisterPage() {
  const { setToken } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      await register(email, password);
      // auto-login after successful registration
      const token = await login(email, password);
      setToken(token);
      const meRes = await getMe();
      const redirectTo = searchParams.get("redirect");
      navigate(redirectTo ?? (meRes.data.is_admin ? "/admin" : "/dashboard"));
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setError(msg ?? "Registration failed");
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
          <p className="text-sm text-slate-500 mt-1">Create your account</p>
        </div>
        {error && (
          <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {error}
          </p>
        )}
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border border-slate-300 rounded-lg px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-indigo-400"
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full border border-slate-300 rounded-lg px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-indigo-400"
          required
        />
        <button
          type="submit"
          className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 font-semibold transition-colors"
        >
          Create Account
        </button>
        <p className="text-sm text-center text-slate-500">
          Already have an account?{" "}
          <Link to="/login" className="text-indigo-600 hover:underline font-medium">
            Sign In
          </Link>
        </p>
      </form>
    </div>
  );
}
