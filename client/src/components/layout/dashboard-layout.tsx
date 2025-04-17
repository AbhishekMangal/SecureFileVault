import React, { ReactNode } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Bell, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

interface DashboardLayoutProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
}

export function DashboardLayout({ children, title, subtitle }: DashboardLayoutProps) {
  const [location] = useLocation();
  
  // Determine page title based on location if not provided
  const getPageTitle = (): string => {
    if (title) return title;
    
    switch (location) {
      case "/dashboard":
        return "Dashboard";
      case "/my-files":
        return "My Files";
      case "/shared-files":
        return "Shared Files";
      case "/encrypted-files":
        return "Encrypted Files";
      case "/security-keys":
        return "Security Keys";
      default:
        return "Dashboard";
    }
  };

  return (
    <div className="h-screen flex overflow-hidden bg-gray-100">
      {/* Sidebar */}
      <Sidebar />
      
      {/* Main content */}
      <div className="flex-1 flex flex-col md:pl-64">
        {/* Top Bar */}
        <div className="sticky top-0 z-10 bg-white shadow-sm">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
            <div className="flex">
              <button type="button" className="text-gray-500 focus:outline-none md:hidden">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <div className="ml-4 md:ml-0">
                <h1 className="text-lg font-bold text-gray-900">{getPageTitle()}</h1>
                {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="icon" className="text-gray-400 hover:text-gray-500">
                <Bell className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" className="text-gray-400 hover:text-gray-500">
                <Settings className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 overflow-auto p-4 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}
