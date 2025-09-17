import { useEffect, lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import LazyLoadingSpinner from "@/components/LazyLoadingSpinner";

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
import { tagStorage } from "@/utils/tagStorage";
import { communicationStorage } from "@/utils/communicationStorage";
import { automationStorage } from "@/utils/automationStorage";
import { reportStorage } from "@/utils/reportStorage";
// Fase 3 - Sistemas Avançados
import { aiStorage } from "@/utils/aiStorage";
import { crmStorage } from "@/utils/crmStorage";
import { integrationStorage } from "@/utils/integrationStorage";
import { userStorage } from "@/utils/userStorage";

const queryClient = new QueryClient();

const App = () => {
  // ===== SISTEMA DE INICIALIZAÇÃO PROFISSIONAL E ROBUSTO =====
  useEffect(() => {
    const initializeApplicationSystems = async () => {
      const initializationStart = performance.now();

      // Configuração profissional de tarefas de inicialização
      const initializationMatrix = [
        // FASE 2 - Sistemas Core (prioridade alta)
        {
          id: 'tags-system',
          name: 'Sistema de Tags',
          fn: () => tagStorage.initializeSystemTags(),
          priority: 'critical',
          dependencies: [],
          timeout: 5000
        },
        {
          id: 'communication-system',
          name: 'Sistema de Comunicação',
          fn: () => communicationStorage.initializeDefaultTemplates(),
          priority: 'high',
          dependencies: [],
          timeout: 3000
        },
        {
          id: 'automation-system',
          name: 'Sistema de Automações',
          fn: () => automationStorage.initializeDefaultAutomations(),
          priority: 'high',
          dependencies: ['communication-system'],
          timeout: 3000
        },
        {
          id: 'reports-system',
          name: 'Sistema de Relatórios',
          fn: () => reportStorage.initializeDefaultReports(),
          priority: 'medium',
          dependencies: [],
          timeout: 3000
        },

        // FASE 3 - Sistemas Avançados (prioridade média/baixa)
        {
          id: 'ai-system',
          name: 'Sistema de IA',
          fn: () => aiStorage.initializeAISystem(),
          priority: 'low',
          dependencies: ['tags-system'],
          timeout: 5000
        },
        {
          id: 'crm-system',
          name: 'Sistema CRM Avançado',
          fn: () => crmStorage.initializeCRMSystem(),
          priority: 'medium',
          dependencies: ['tags-system'],
          timeout: 4000
        },
        {
          id: 'integration-system',
          name: 'Sistema de Integrações',
          fn: () => integrationStorage.initializeIntegrationSystem(),
          priority: 'low',
          dependencies: [],
          timeout: 3000
        },
        {
          id: 'user-system',
          name: 'Sistema de Usuários',
          fn: () => userStorage.initializeUserSystem(),
          priority: 'critical',
          dependencies: [],
          timeout: 5000
        },
      ];

      // Estrutura de resultado profissional
      const initializationResults = {
        totalSystems: initializationMatrix.length,
        successful: 0,
        failed: 0,
        warnings: 0,
        critical_failures: 0,
        execution_time: 0,
        system_status: {},
        error_details: [],
        performance_metrics: {}
      };

      console.group('🚀 Ferraco CRM - Inicialização de Sistemas Empresariais');
      console.log(`📊 Iniciando carregamento de ${initializationMatrix.length} sistemas...`);

      // Execução profissional com gerenciamento de dependências
      const executedSystems = new Set();
      const systemPromises = new Map();

      const executeSystem = async (task) => {
        const startTime = performance.now();

        try {
          // Verificar dependências
          for (const dep of task.dependencies) {
            if (!executedSystems.has(dep)) {
              await systemPromises.get(dep);
            }
          }

          // Executar com timeout profissional
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error(`Timeout após ${task.timeout}ms`)), task.timeout)
          );

          await Promise.race([
            Promise.resolve(task.fn()),
            timeoutPromise
          ]);

          const executionTime = performance.now() - startTime;
          executedSystems.add(task.id);

          initializationResults.successful++;
          initializationResults.system_status[task.id] = 'SUCCESS';
          initializationResults.performance_metrics[task.id] = `${executionTime.toFixed(2)}ms`;

          console.log(`✅ ${task.name} - Inicializado (${executionTime.toFixed(2)}ms)`);

        } catch (error) {
          const executionTime = performance.now() - startTime;
          const isCritical = task.priority === 'critical';

          initializationResults.system_status[task.id] = 'FAILED';
          initializationResults.performance_metrics[task.id] = `${executionTime.toFixed(2)}ms (FAILED)`;
          initializationResults.error_details.push({
            system: task.name,
            id: task.id,
            error: error.message,
            priority: task.priority,
            execution_time: executionTime
          });

          if (isCritical) {
            initializationResults.critical_failures++;
            console.error(`🔴 CRÍTICO: ${task.name} - Falha crítica`, error);
          } else {
            initializationResults.failed++;
            console.warn(`⚠️ ${task.name} - Falha não crítica`, error);
          }
        }
      };

      // Criar promises para todos os sistemas
      initializationMatrix.forEach(task => {
        systemPromises.set(task.id, executeSystem(task));
      });

      // Aguardar conclusão de todos os sistemas
      await Promise.allSettled(Array.from(systemPromises.values()));

      // ===== CONFIGURAÇÃO GLOBAL PROFISSIONAL =====
      if (typeof window !== 'undefined') {
        const globalConfig = {
          // Core Systems (Fase 2)
          tagStorage,
          communicationStorage,
          automationStorage,
          reportStorage,

          // Advanced Systems (Fase 3)
          aiStorage,
          crmStorage,
          integrationStorage,
          userStorage,

          // System metadata
          systemInfo: {
            version: '3.0.0',
            initialized_at: new Date().toISOString(),
            systems_loaded: initializationResults.successful,
            initialization_results: initializationResults
          }
        };

        Object.assign(window, globalConfig);
      }

      // ===== RELATÓRIO FINAL PROFISSIONAL =====
      const totalTime = performance.now() - initializationStart;
      initializationResults.execution_time = totalTime;

      console.log('\n📈 Relatório de Inicialização:');
      console.table({
        'Sistemas Totais': initializationResults.totalSystems,
        'Sucessos': initializationResults.successful,
        'Falhas': initializationResults.failed,
        'Falhas Críticas': initializationResults.critical_failures,
        'Tempo Total': `${totalTime.toFixed(2)}ms`,
        'Taxa de Sucesso': `${((initializationResults.successful / initializationResults.totalSystems) * 100).toFixed(1)}%`
      });

      console.log('\n🎯 Status por Sistema:');
      console.table(initializationResults.system_status);

      if (initializationResults.error_details.length > 0) {
        console.log('\n⚠️ Detalhes de Erros:');
        console.table(initializationResults.error_details);
      }

      // Determinar status final do sistema
      if (initializationResults.critical_failures > 0) {
        console.error('🔴 SISTEMA COM FALHAS CRÍTICAS - Operação pode estar comprometida');
      } else if (initializationResults.failed > 0) {
        console.warn('🟡 SISTEMA OPERACIONAL COM AVISOS - Algumas funcionalidades podem estar limitadas');
      } else {
        console.log('🟢 SISTEMA TOTALMENTE OPERACIONAL - Todas as funcionalidades disponíveis');
      }

      console.log(`\n🚀 Ferraco CRM v3.0 - Carregamento completo em ${totalTime.toFixed(2)}ms`);
      console.groupEnd();
    };

    // Executar inicialização
    initializeApplicationSystems().catch(error => {
      console.error('💥 Erro fatal na inicialização do sistema:', error);
    });
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
                      <Suspense fallback={<LazyLoadingSpinner message="Carregando Dashboard..." route="/admin" />}>
                        <AdminDashboard />
                      </Suspense>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/leads"
                  element={
                    <ProtectedRoute requiredPermission="leads:read">
                      <Suspense fallback={<LazyLoadingSpinner message="Carregando Leads..." route="/admin/leads" />}>
                        <AdminLeads />
                      </Suspense>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/tags"
                  element={
                    <ProtectedRoute requiredPermission="tags:read">
                      <Suspense fallback={<LazyLoadingSpinner message="Carregando Tags..." route="/admin/tags" />}>
                        <AdminTags />
                      </Suspense>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/whatsapp"
                  element={
                    <ProtectedRoute requiredPermission="leads:write">
                      <Suspense fallback={<LazyLoadingSpinner message="Carregando WhatsApp..." route="/admin/whatsapp" />}>
                        <AdminWhatsApp />
                      </Suspense>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/automations"
                  element={
                    <ProtectedRoute requiredPermission="leads:write">
                      <Suspense fallback={<LazyLoadingSpinner message="Carregando Automações..." route="/admin/automations" />}>
                        <AdminAutomations />
                      </Suspense>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/reports"
                  element={
                    <ProtectedRoute requiredPermission="leads:read">
                      <Suspense fallback={<LazyLoadingSpinner message="Carregando Relatórios..." route="/admin/reports" />}>
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
                      <Suspense fallback={<LazyLoadingSpinner message="Carregando IA & Analytics..." route="/admin/ai" />}>
                        <AdminAI />
                      </Suspense>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/crm"
                  element={
                    <ProtectedRoute requiredPermission="leads:write">
                      <Suspense fallback={<LazyLoadingSpinner message="Carregando CRM & Pipeline..." route="/admin/crm" />}>
                        <AdminCRM />
                      </Suspense>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/integrations"
                  element={
                    <ProtectedRoute requiredRole="admin">
                      <Suspense fallback={<LazyLoadingSpinner message="Carregando Integrações..." route="/admin/integrations" />}>
                        <AdminIntegrations />
                      </Suspense>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/users"
                  element={
                    <ProtectedRoute requiredPermission="admin:read">
                      <Suspense fallback={<LazyLoadingSpinner message="Carregando Gestão de Usuários..." route="/admin/users" />}>
                        <AdminUsers />
                      </Suspense>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/security"
                  element={
                    <ProtectedRoute requiredPermission="admin:read">
                      <Suspense fallback={<LazyLoadingSpinner message="Carregando Dashboard de Segurança..." route="/admin/security" />}>
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
