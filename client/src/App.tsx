import { Switch, Route, Redirect, useLocation } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider, useAuth } from "@/context/auth-context";
import { FileProvider } from "@/context/file-context";
import NotFound from "@/pages/not-found";
import Auth from "@/pages/auth";
import Dashboard from "@/pages/dashboard";
import MyFiles from "@/pages/my-files";
import SharedFiles from "@/pages/shared-files";
import EncryptedFiles from "@/pages/encrypted-files";
import SecurityKeys from "@/pages/security-keys";

// Protected Route component
function ProtectedRoute({ component: Component, ...rest }: { component: React.ComponentType<any>, [key: string]: any }) {
  const { isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  if (!isAuthenticated) {
    setLocation("/auth");
    return null;
  }

  return <Component {...rest} />;
}

function Router() {
  const { isAuthenticated } = useAuth();
  const [location] = useLocation();

  // Redirect to dashboard if already authenticated and trying to access auth page
  if (isAuthenticated && location === "/auth") {
    return <Redirect to="/dashboard" />;
  }

  return (
    <Switch>
      <Route path="/auth" component={Auth} />
      <Route path="/dashboard">
        <ProtectedRoute component={Dashboard} />
      </Route>
      <Route path="/my-files">
        <ProtectedRoute component={MyFiles} />
      </Route>
      <Route path="/shared-files">
        <ProtectedRoute component={SharedFiles} />
      </Route>
      <Route path="/encrypted-files">
        <ProtectedRoute component={EncryptedFiles} />
      </Route>
      <Route path="/security-keys">
        <ProtectedRoute component={SecurityKeys} />
      </Route>
      <Route path="/">
        <Redirect to={isAuthenticated ? "/dashboard" : "/auth"} />
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <FileProvider>
          <Router />
          <Toaster />
        </FileProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
