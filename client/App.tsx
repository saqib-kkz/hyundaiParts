import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import CustomerLanding from "./pages/CustomerLanding";
import Dashboard from "./pages/Dashboard";
import Settings from "./pages/Settings";
import WhatsAppChat from "./pages/WhatsAppChat";
import Login from "./pages/Login";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";
import PaymentSuccess from "./pages/PaymentSuccess";
import PaymentCancel from "./pages/PaymentCancel";
import PaymentCheckout from "./pages/PaymentCheckout";
import StripeCheckout from "./pages/StripeCheckout";
import { AuthProvider, useAuth } from "./lib/auth";
import ErrorBoundary from "./components/ErrorBoundary";

const queryClient = new QueryClient();

// Protected Route Component
function ProtectedRoute({ 
  children, 
  requiredRole = "agent",
  requiredPermission
}: { 
  children: React.ReactNode;
  requiredRole?: string;
  requiredPermission?: string;
}) {
  const { user, isLoading, canAccess, hasPermission } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && !canAccess(requiredRole)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-8 text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-red-600">Access Denied</h2>
          <p className="mt-2 text-sm text-gray-600">
            This page requires {requiredRole} role or higher.
          </p>
        </div>
      </div>
    );
  }

  if (requiredPermission && !hasPermission(requiredPermission)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-8 text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-red-600">Access Denied</h2>
          <p className="mt-2 text-sm text-gray-600">
            You don't have permission to access this page.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

function AppRoutes() {
  const { user } = useAuth();

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<CustomerLanding />} />
        <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <Login />} />
        
                       {/* Payment Routes - Public Access */}
               <Route path="/payment/checkout" element={<PaymentCheckout />} />
               <Route path="/payment/stripe-checkout" element={<StripeCheckout />} />
               <Route path="/payment/success" element={<PaymentSuccess />} />
               <Route path="/payment/cancel" element={<PaymentCancel />} />
        
        {/* Admin Portal Route */}
        <Route 
          path="/admin" 
          element={
            <ProtectedRoute>
              <Index />
            </ProtectedRoute>
          } 
        />
        
        {/* Protected Dashboard Routes - Login First Architecture */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute requiredRole="agent">
              <ErrorBoundary>
                <Dashboard />
              </ErrorBoundary>
            </ProtectedRoute>
          }
        />
        
        <Route 
          path="/settings" 
          element={
            <ProtectedRoute requiredRole="admin">
              <Settings />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/whatsapp" 
          element={
            <ProtectedRoute requiredRole="agent" requiredPermission="whatsapp.send">
              <WhatsAppChat />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/profile" 
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } 
        />
        
        {/* Redirect unauthenticated users from old routes */}
        <Route path="/old-dashboard" element={<Navigate to="/dashboard" replace />} />
        
        {/* Catch-all Route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

createRoot(document.getElementById("root")!).render(<App />);
