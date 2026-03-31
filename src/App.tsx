import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useParams, useSearchParams } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { MainLayout } from "@/components/layout/MainLayout";
import { OwnerLayout } from "@/components/layout/OwnerLayout";
import { CRMLayout } from "@/components/crm/CRMLayout";
import Login from "./pages/Login";
import Register from "./pages/Register";
import NotFound from "./pages/NotFound";
import GovernancaUsuarios from "./pages/GovernancaUsuarios";
import GovernancaPerfis from "./pages/GovernancaPerfis";
import GovernancaEmpresa from "./pages/GovernancaEmpresa";
import GovernancaAuditoria from "./pages/GovernancaAuditoria";
import ActivateAccount from "./pages/ActivateAccount";
import ForgotPassword from "./pages/ForgotPassword";
import OwnerDashboard from "./pages/OwnerDashboard";

function LegacyNewPasswordRedirect() {
  const { token } = useParams();
  const [searchParams] = useSearchParams();
  const q = searchParams.toString();
  return <Navigate to={q ? `/activate/${token}?${q}` : `/activate/${token!}`} replace />;
}

const queryClient = new QueryClient();

function ProtectedRoute({ children, ownerOnly }: { children: React.ReactNode; ownerOnly?: boolean }) {
  const { isAuthenticated, isLoading, role } = useAuth();

  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: '#0f0a1a',
        color: '#94a3b8',
        fontSize: '0.95rem',
      }}>
        Carregando...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Owner trying to access tenant routes → redirect to owner panel
  if (!ownerOnly && role === 'OWNER') {
    return <Navigate to="/owner" replace />;
  }

  // Non-owner trying to access owner routes → redirect to home
  if (ownerOnly && role !== 'OWNER') {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, role } = useAuth();

  if (isLoading) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          background: '#0f0a1a',
          color: '#94a3b8',
          fontSize: '0.95rem',
        }}
      >
        Carregando…
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to={role === 'OWNER' ? '/owner' : '/'} replace />;
  }

  return <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route
              path="/login"
              element={
                <PublicRoute>
                  <Login />
                </PublicRoute>
              }
            />
            <Route
              path="/register"
              element={
                <PublicRoute>
                  <Register />
                </PublicRoute>
              }
            />
            <Route
              path="/forgot-password"
              element={
                <PublicRoute>
                  <ForgotPassword />
                </PublicRoute>
              }
            />
            <Route
              path="/activate/:token"
              element={
                <PublicRoute>
                  <ActivateAccount />
                </PublicRoute>
              }
            />
            <Route path="/new-password/:token" element={<LegacyNewPasswordRedirect />} />
            <Route
              path="/owner"
              element={
                <ProtectedRoute ownerOnly>
                  <OwnerLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<OwnerDashboard />} />
            </Route>
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <MainLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<CRMLayout />} />
              <Route path="governanca/usuarios" element={<GovernancaUsuarios />} />
              <Route path="governanca/perfis" element={<GovernancaPerfis />} />
              <Route path="governanca/empresa" element={<GovernancaEmpresa />} />
              <Route path="governanca/auditoria" element={<GovernancaAuditoria />} />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
