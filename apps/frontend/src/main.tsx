import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// ✅ FIX: Limpar Service Workers antigos que podem estar causando problemas
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    // Manter apenas o Service Worker mais recente
    if (registrations.length > 1) {
      console.log('🧹 Limpando Service Workers antigos...');
      registrations.slice(0, -1).forEach((registration) => {
        registration.unregister();
      });
    }
  });
}

createRoot(document.getElementById("root")!).render(<App />);
