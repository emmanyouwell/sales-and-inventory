import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/context/AuthProvider";

// Pages
import NotFound from "@/pages/not-found";
import Login from "@/pages/login";
import Register from "@/pages/register";
import Dashboard from "@/pages/dashboard";
import Products from "@/pages/products";
import Profile from "@/pages/profile";
import Orders from "@/pages/reports";
import TransactionPage from "@/pages/TransactionPage";
import ResetStaffPassword from "@/pages/reset-staff-password";

/* --------------------------- Protected Routes --------------------------- */
function ProtectedRoute({ component: Component, adminOnly = false }: any) {
  const { user } = useAuth();

  // If no user is logged in, redirect to login
  if (!user) {
    return <Redirect to="/login" />;
  }

  // If admin-only route, block staff/supplier
  if (adminOnly && user.role.toLowerCase() !== "admin") {
    return <Redirect to="/dashboard" />;
  }

  return <Component />;
}

/* ----------------------------- Router Setup ----------------------------- */
function Router() {
  return (
    <Switch>
      {/* Public Routes */}
      <Route path="/" component={Login} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />

      {/* Protected Routes */}
      <Route path="/dashboard">
        <ProtectedRoute component={Dashboard} />
      </Route>
      <Route path="/products">
        <ProtectedRoute component={Products} />
      </Route>
      <Route path="/profile">
        <ProtectedRoute component={Profile} />
      </Route>
      <Route path="/orders">
        <ProtectedRoute component={Orders} />
      </Route>
      <Route path="/transaction">
        <ProtectedRoute component={TransactionPage} />
      </Route>

      {/* ✅ Admin Only */}
      <Route path="/reset-staff-password">
        <ProtectedRoute component={ResetStaffPassword} adminOnly />
      </Route>

      {/* Catch-all */}
      <Route component={NotFound} />
    </Switch>
  );
}

/* ----------------------------- Root App ----------------------------- */
function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <Router />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
