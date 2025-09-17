import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/contexts/ThemeContext";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminLeads from "./pages/admin/AdminLeads";
import AdminTags from "./pages/admin/AdminTags";
import AdminWhatsApp from "./pages/admin/AdminWhatsApp";
import AdminAutomations from "./pages/admin/AdminAutomations";
import AdminReports from "./pages/admin/AdminReports";
// Fase 3 - Páginas Avançadas
import AdminAI from "./pages/admin/AdminAI";
import AdminCRM from "./pages/admin/AdminCRM";
import AdminIntegrations from "./pages/admin/AdminIntegrations";
import AdminUsers from "./pages/admin/AdminUsers";
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
  // Inicialização dos sistemas das Fases 2 e 3
  useEffect(() => {
    const initializeAllSystems = () => {
      try {
        // ===== FASE 2 =====
        // Inicializar tags do sistema
        tagStorage.initializeSystemTags();

        // Inicializar templates de WhatsApp padrão
        communicationStorage.initializeDefaultTemplates();

        // Inicializar automações padrão
        automationStorage.initializeDefaultAutomations();

        // Inicializar relatórios padrão
        reportStorage.initializeDefaultReports();

        // ===== FASE 3 =====
        // Inicializar sistema de IA
        aiStorage.initializeAISystem();

        // Inicializar CRM e pipelines
        crmStorage.initializeDefaultPipelines();

        // Inicializar integrações disponíveis
        integrationStorage.initializeAvailableIntegrations();

        // Inicializar sistema de usuários e permissões
        userStorage.initializeUserSystem();

        // Configurar storage global
        if (typeof window !== 'undefined') {
          // Fase 2
          window.tagStorage = tagStorage;
          window.communicationStorage = communicationStorage;
          window.automationStorage = automationStorage;
          window.reportStorage = reportStorage;

          // Fase 3
          window.aiStorage = aiStorage;
          window.crmStorage = crmStorage;
          window.integrationStorage = integrationStorage;
          window.userStorage = userStorage;
        }

        console.log('✅ Sistemas das Fases 2 e 3 inicializados com sucesso');
        console.log('🚀 Ferraco CRM - Versão Completa carregada!');
      } catch (error) {
        console.error('❌ Erro ao inicializar sistemas:', error);
      }
    };

    initializeAllSystems();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/leads" element={<AdminLeads />} />
              <Route path="/admin/tags" element={<AdminTags />} />
              <Route path="/admin/whatsapp" element={<AdminWhatsApp />} />
              <Route path="/admin/automations" element={<AdminAutomations />} />
              <Route path="/admin/reports" element={<AdminReports />} />
              {/* FASE 3 - ROTAS AVANÇADAS */}
              <Route path="/admin/ai" element={<AdminAI />} />
              <Route path="/admin/crm" element={<AdminCRM />} />
              <Route path="/admin/integrations" element={<AdminIntegrations />} />
              <Route path="/admin/users" element={<AdminUsers />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
