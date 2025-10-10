import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import LoadingSpinner from "@/components/LoadingSpinner";

const queryClient = new QueryClient();

// Lazy import para páginas
const Index = lazy(() => import("./pages/Index"));
const PublicChat = lazy(() => import("./pages/PublicChat"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminLeads = lazy(() => import("./pages/admin/AdminLeads"));
const AdminWhatsApp = lazy(() => import("./pages/admin/AdminWhatsApp"));
const AdminReports = lazy(() => import("./pages/admin/AdminReports"));
const AdminProfile = lazy(() => import("./pages/admin/AdminProfile"));
const AdminLandingPageEditor = lazy(() => import("./pages/admin/AdminLandingPageEditor"));
const AdminChatbotConfig = lazy(() => import("./pages/admin/AdminChatbotConfig"));

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

          {/* ADMIN ROUTES - Públicas (sem autenticação) */}
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
            path="/admin/reports"
            element={
              <Suspense fallback={<LoadingSpinner />}>
                <AdminReports />
              </Suspense>
            }
          />
          <Route
            path="/admin/profile"
            element={
              <Suspense fallback={<LoadingSpinner />}>
                <AdminProfile />
              </Suspense>
            }
          />
          <Route
            path="/admin/landing-page"
            element={
              <Suspense fallback={<LoadingSpinner />}>
                <AdminLandingPageEditor />
              </Suspense>
            }
          />
          <Route
            path="/admin/chatbot-config"
            element={
              <Suspense fallback={<LoadingSpinner />}>
                <AdminChatbotConfig />
              </Suspense>
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
