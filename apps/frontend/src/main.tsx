import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// ✅ CRITICAL FIX: Desregistrar TODOS os Service Workers até resolver problema de backend
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    if (registrations.length > 0) {
      console.log('🧹 Removendo TODOS os Service Workers...');
      registrations.forEach((registration) => {
        registration.unregister();
        console.log('✅ Service Worker removido:', registration.scope);
      });
    }
  });
}

createRoot(document.getElementById("root")!).render(<App />);
