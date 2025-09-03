import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { AuthGuard } from "./components/auth/AuthGuard";
import { Landing } from "./pages/Landing";
import { AuthPage } from "./components/auth/AuthPage";
import { AppNavigation } from "./components/layout/AppNavigation";
import Discover from "./pages/Discover";
import Matches from "./pages/Matches";
import Events from "./pages/Events";
import Chat from "./pages/Chat";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <div className="pb-20">
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/discover" element={
                <ProtectedRoute>
                  <AuthGuard>
                    <Discover />
                  </AuthGuard>
                </ProtectedRoute>
              } />
              <Route path="/matches" element={
                <ProtectedRoute>
                  <AuthGuard>
                    <Matches />
                  </AuthGuard>
                </ProtectedRoute>
              } />
              <Route path="/events" element={
                <ProtectedRoute>
                  <AuthGuard>
                    <Events />
                  </AuthGuard>
                </ProtectedRoute>
              } />
              <Route path="/chat/:matchId" element={
                <ProtectedRoute>
                  <AuthGuard>
                    <Chat />
                  </AuthGuard>
                </ProtectedRoute>
              } />
              <Route path="/profile" element={
                <ProtectedRoute>
                  <AuthGuard>
                    <Profile />
                  </AuthGuard>
                </ProtectedRoute>
              } />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </div>
          <AppNavigation />
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
