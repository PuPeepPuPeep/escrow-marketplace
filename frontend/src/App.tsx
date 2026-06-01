import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { LanguageProvider } from "./context/LanguageContext";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardPage from "./pages/DashboardPage";
import DealRoomPage from "./pages/DealRoomPage";
import WalletPage from "./pages/WalletPage";
import AdminPage from "./pages/admin/AdminPage";

/** Redirects to /login if not authenticated. */
function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { token, loading } = useAuth();
  if (loading) return <div className="p-8 text-slate-400">Loading…</div>;
  return token ? <>{children}</> : <Navigate to="/login" replace />;
}

/** Redirects non-admin users to /dashboard. */
function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="p-8 text-slate-400">Loading…</div>;
  return user?.is_admin ? <>{children}</> : <Navigate to="/dashboard" replace />;
}

/** Redirects admin users to /admin. */
function UserRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="p-8 text-slate-400">Loading…</div>;
  return user && !user.is_admin ? <>{children}</> : <Navigate to="/admin" replace />;
}

/** Smart default: send authenticated users to the right home page. */
function DefaultRedirect() {
  const { token, user, loading } = useAuth();
  if (loading) return <div className="p-8 text-slate-400">Loading…</div>;
  if (!token) return <Navigate to="/login" replace />;
  return <Navigate to={user?.is_admin ? "/admin" : "/dashboard"} replace />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/deal/:token" element={<DealRoomPage />} />
      <Route
        path="/dashboard"
        element={
          <PrivateRoute>
            <UserRoute>
              <DashboardPage />
            </UserRoute>
          </PrivateRoute>
        }
      />
      <Route
        path="/wallet"
        element={
          <PrivateRoute>
            <UserRoute>
              <WalletPage />
            </UserRoute>
          </PrivateRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <PrivateRoute>
            <AdminRoute>
              <AdminPage />
            </AdminRoute>
          </PrivateRoute>
        }
      />
      <Route path="*" element={<DefaultRedirect />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <LanguageProvider>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </LanguageProvider>
    </BrowserRouter>
  );
}
