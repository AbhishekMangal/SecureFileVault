import React from 'react';
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import Home from "@/pages/home.jsx";
import Login from "@/pages/login.jsx";
import Register from "@/pages/register.jsx";
import NotFound from "@/pages/not-found.jsx";

// Set authorization header for all requests
if (typeof window !== 'undefined') {
  const token = localStorage.getItem('token');
  if (token) {
    queryClient.setDefaultOptions({
      queries: {
        queryFn: async ({ queryKey }) => {
          const res = await fetch(queryKey[0], {
            headers: {
              'Authorization': `Bearer ${token}`
            },
            credentials: 'include',
          });
          
          if (res.status === 401) {
            localStorage.removeItem('token');
            window.location.href = '/login';
            return null;
          }
          
          if (!res.ok) {
            const text = await res.text();
            throw new Error(`${res.status}: ${text || res.statusText}`);
          }
          
          return await res.json();
        },
      },
    });
  }
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;