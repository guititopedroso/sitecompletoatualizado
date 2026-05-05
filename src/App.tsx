import { useState, useEffect } from "react";
import { useLocation, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";

import { LanguageProvider } from "@/i18n/LanguageContext";
import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index";
import Booking from "./pages/Booking";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import NotFound from "./pages/NotFound";
import Admin from "./pages/Admin";
import Staff from "./pages/Staff";
import Referral from "./pages/Referral";
import GalleryPage from "./pages/GalleryPage";
import AdminGallery from "./pages/AdminGallery";
import Login from "./pages/Login";
import Profile from "./pages/Profile";
import Maintenance from "./pages/Maintenance";
import ReferralTracker from "./components/ReferralTracker";

const queryClient = new QueryClient();

const AppContent = () => {
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "settings", "general"), (docSnap) => {
      if (docSnap.exists()) {
        setMaintenanceMode(docSnap.data().maintenanceMode === true);
      } else {
        setMaintenanceMode(false);
      }
    }, (err) => {
      console.error("Error fetching maintenance state:", err);
    });
    return unsub;
  }, []);

  const isMaintenanceRoute = maintenanceMode && !location.pathname.startsWith('/admin') && !location.pathname.startsWith('/staff') && !location.pathname.startsWith('/login');

  if (isMaintenanceRoute) {
    return <Maintenance />;
  }

  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/reservar" element={<Booking />} />
      <Route path="/termos" element={<Terms />} />
      <Route path="/privacidade" element={<Privacy />} />
      <Route path="/admin-painel" element={<Admin />} />
      <Route path="/staff-painel" element={<Staff />} />
      <Route path="/afiliado" element={<Referral />} />
      <Route path="/galeria" element={<GalleryPage />} />
      <Route path="/admin/gallery" element={<AdminGallery />} />
      <Route path="/login" element={<Login />} />
      <Route path="/perfil" element={<Profile />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <AuthProvider>
        <TooltipProvider>
          <ReferralTracker />
          <Toaster />
          <Sonner />
          <AppContent />
        </TooltipProvider>
      </AuthProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;
