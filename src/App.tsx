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

// Lazy import para páginas administrativas (carregamento sob demanda)
// Core pages - Sempre carregadas para usuários autenticados
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));

// Lead management pages - Para usuários com permissões de leads
const AdminLeads = lazy(() => import("./pages/admin/AdminLeads"));

// Communication & Automation pages - Para usuários com permissões de escrita
const AdminTags = lazy(() => import("./pages/admin/AdminTags"));
const AdminWhatsApp = lazy(() => import("./pages/admin/AdminWhatsApp"));
const AdminAutomations = lazy(() => import("./pages/admin/AdminAutomations"));
const AdminReports = lazy(() => import("./pages/admin/AdminReports"));

// Advanced features - Para usuários com permissões específicas
const AdminAI = lazy(() => import("./pages/admin/AdminAI"));
const AdminCRM = lazy(() => import("./pages/admin/AdminCRM"));
const AdminIntegrations = lazy(() => import("./pages/admin/AdminIntegrations"));

// Admin-only pages - Apenas para administradores
const AdminUsers = lazy(() => import("./pages/admin/AdminUsers"));
const AdminSecurity = lazy(() => import("./pages/admin/AdminSecurity"));

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
          import('@/utils/automationStorage').then(m => m.automationStorage.initializeDefaultAutomations()),
          import('@/utils/reportStorage').then(m => m.reportStorage.initializeDefaultReports()),
          import('@/utils/aiStorage').then(m => m.aiStorage.initializeAISettings()),
          import('@/utils/crmStorage').then(m => m.crmStorage.initializeCRMData()),
          import('@/utils/integrationStorage').then(m => m.integrationStorage.initializeIntegrations()),
          import('@/utils/userStorage').then(m => m.userStorage.initializeRoles()),
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

                {/* PROTECTED ADMIN ROUTES */}
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
                    <ProtectedRoute requiredPermission="leads:read">
                      <Suspense fallback={<LoadingSpinner />}>
                        <AdminLeads />
                      </Suspense>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/tags"
                  element={
                    <ProtectedRoute requiredPermission="tags:read">
                      <Suspense fallback={<LoadingSpinner />}>
                        <AdminTags />
                      </Suspense>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/whatsapp"
                  element={
                    <ProtectedRoute requiredPermission="leads:write">
                      <Suspense fallback={<LoadingSpinner />}>
                        <AdminWhatsApp />
                      </Suspense>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/automations"
                  element={
                    <ProtectedRoute requiredPermission="leads:write">
                      <Suspense fallback={<LoadingSpinner />}>
                        <AdminAutomations />
                      </Suspense>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/reports"
                  element={
                    <ProtectedRoute requiredPermission="leads:read">
                      <Suspense fallback={<LoadingSpinner />}>
                        <AdminReports />
                      </Suspense>
                    </ProtectedRoute>
                  }
                />

                {/* FASE 3 - ROTAS AVANÇADAS PROTEGIDAS */}
                <Route
                  path="/admin/ai"
                  element={
                    <ProtectedRoute requiredRole="admin">
                      <Suspense fallback={<LoadingSpinner />}>
                        <AdminAI />
                      </Suspense>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/crm"
                  element={
                    <ProtectedRoute requiredPermission="leads:write">
                      <Suspense fallback={<LoadingSpinner />}>
                        <AdminCRM />
                      </Suspense>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/integrations"
                  element={
                    <ProtectedRoute requiredRole="admin">
                      <Suspense fallback={<LoadingSpinner />}>
                        <AdminIntegrations />
                      </Suspense>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/users"
                  element={
                    <ProtectedRoute requiredPermission="admin:read">
                      <Suspense fallback={<LoadingSpinner />}>
                        <AdminUsers />
                      </Suspense>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/security"
                  element={
                    <ProtectedRoute requiredPermission="admin:read">
                      <Suspense fallback={<LoadingSpinner />}>
                        <AdminSecurity />
                      </Suspense>
                    </ProtectedRoute>
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
