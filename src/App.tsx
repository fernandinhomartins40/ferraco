import { useEffect, lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import LoadingSpinner from "@/components/LoadingSpinner";
import { logger } from "@/lib/logger";

// Import páginas públicas diretamente (carregamento imediato)
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import PublicChat from "./pages/PublicChat";

// Lazy import para páginas administrativas (carregamento sob demanda)
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminLeads = lazy(() => import("./pages/admin/AdminLeads"));
const AdminWhatsApp = lazy(() => import("./pages/admin/AdminWhatsApp"));
const AdminAI = lazy(() => import("./pages/admin/AdminAI"));
const AdminReports = lazy(() => import("./pages/admin/AdminReports"));

const queryClient = new QueryClient();

const App = () => {
  // ===== SISTEMA DE INICIALIZAÇÃO ASSÍNCRONA OTIMIZADA =====
  useEffect(() => {
    const initializeStorages = async () => {
      const startTime = performance.now();

      logger.info('Ferraco CRM - Inicializando sistemas com lazy loading...');

      try {
        // Carregar storages em paralelo com dynamic imports
        await Promise.all([
          import('@/utils/tagStorage').then(m => m.tagStorage.initializeSystemTags()),
          import('@/utils/communicationStorage').then(m => m.communicationStorage.initializeDefaultTemplates()),
          import('@/utils/reportStorage').then(m => m.reportStorage.initializeDefaultReports()),
        ]);

        const totalTime = performance.now() - startTime;
        logger.info(`Sistemas inicializados com sucesso em ${totalTime.toFixed(2)}ms`);
      } catch (error) {
        logger.error('Erro na inicialização dos sistemas:', error);
      }
    };

    initializeStorages();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                {/* PUBLIC ROUTES */}
                <Route path="/" element={<Index />} />
                <Route path="/login" element={<Login />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/chat/:shortCode" element={<PublicChat />} />

                {/* ADMIN ROUTES - SEM AUTENTICAÇÃO (DEMO MODE) */}
                <Route
                  path="/admin"
                  element={
                    <Suspense fallback={<LoadingSpinner />}>
                      <AdminDashboard />
                    </Suspense>
                  }
                />
                <Route
                  path="/admin/leads"
                  element={
                    <Suspense fallback={<LoadingSpinner />}>
                      <AdminLeads />
                    </Suspense>
                  }
                />
                <Route
                  path="/admin/whatsapp"
                  element={
                    <Suspense fallback={<LoadingSpinner />}>
                      <AdminWhatsApp />
                    </Suspense>
                  }
                />
                <Route
                  path="/admin/ai"
                  element={
                    <Suspense fallback={<LoadingSpinner />}>
                      <AdminAI />
                    </Suspense>
                  }
                />
                <Route
                  path="/admin/reports"
                  element={
                    <Suspense fallback={<LoadingSpinner />}>
                      <AdminReports />
                    </Suspense>
                  }
                />

                {/* CATCH-ALL ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
