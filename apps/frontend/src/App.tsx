import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import LoadingSpinner from "@/components/LoadingSpinner";

// Configuração do QueryClient com tratamento de autenticação
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Não refetch automaticamente em erro de autenticação
      refetchOnWindowFocus: false,
      // Retry apenas se não for erro 401/403
      retry: (failureCount, error: any) => {
        if (error?.response?.status === 401 || error?.response?.status === 403) {
          return false; // Não retry em erros de autenticação
        }
        return failureCount < 3; // Retry até 3 vezes para outros erros
      },
      // Tempo que os dados ficam "fresh" antes de refetch
      staleTime: 5 * 60 * 1000, // 5 minutos
    },
  },
});

// Lazy import para páginas
const Index = lazy(() => import("./pages/Index"));
const PublicChat = lazy(() => import("./pages/PublicChat"));
const Login = lazy(() => import("./pages/Login"));
const Unauthorized = lazy(() => import("./pages/Unauthorized"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminLeads = lazy(() => import("./pages/admin/AdminLeads"));
const AdminWhatsApp = lazy(() => import("./pages/admin/AdminWhatsApp"));
const AdminReports = lazy(() => import("./pages/admin/AdminReports"));
const AdminProfile = lazy(() => import("./pages/admin/AdminProfile"));
const AdminLandingPageEditor = lazy(() => import("./pages/admin/AdminLandingPageEditor"));
const AdminChatbotConfig = lazy(() => import("./pages/admin/AdminChatbotConfig"));
const WhatsAppContacts = lazy(() => import("./pages/WhatsAppContacts"));

// Import ProtectedRoute
import { ProtectedRoute } from "./components/ProtectedRoute";

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
        <Routes>
          {/* Landing Page */}
          <Route
            path="/"
            element={
              <Suspense fallback={<LoadingSpinner />}>
                <Index />
              </Suspense>
            }
          />

          {/* Chat Público */}
          <Route
            path="/chat"
            element={
              <Suspense fallback={<LoadingSpinner />}>
                <PublicChat />
              </Suspense>
            }
          />

          {/* Login */}
          <Route
            path="/login"
            element={
              <Suspense fallback={<LoadingSpinner />}>
                <Login />
              </Suspense>
            }
          />

          {/* Unauthorized */}
          <Route
            path="/unauthorized"
            element={
              <Suspense fallback={<LoadingSpinner />}>
                <Unauthorized />
              </Suspense>
            }
          />

          {/* ADMIN ROUTES - PROTEGIDAS (requerem autenticação) */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <Suspense fallback={<LoadingSpinner />}>
                  <AdminDashboard />
                </Suspense>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/leads"
            element={
              <ProtectedRoute>
                <Suspense fallback={<LoadingSpinner />}>
                  <AdminLeads />
                </Suspense>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/whatsapp"
            element={
              <ProtectedRoute>
                <Suspense fallback={<LoadingSpinner />}>
                  <AdminWhatsApp />
                </Suspense>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/reports"
            element={
              <ProtectedRoute>
                <Suspense fallback={<LoadingSpinner />}>
                  <AdminReports />
                </Suspense>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/profile"
            element={
              <ProtectedRoute>
                <Suspense fallback={<LoadingSpinner />}>
                  <AdminProfile />
                </Suspense>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/landing-page"
            element={
              <ProtectedRoute>
                <Suspense fallback={<LoadingSpinner />}>
                  <AdminLandingPageEditor />
                </Suspense>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/chatbot-config"
            element={
              <ProtectedRoute>
                <Suspense fallback={<LoadingSpinner />}>
                  <AdminChatbotConfig />
                </Suspense>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/whatsapp/contacts"
            element={
              <ProtectedRoute>
                <Suspense fallback={<LoadingSpinner />}>
                  <WhatsAppContacts />
                </Suspense>
              </ProtectedRoute>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Routes>
      </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
