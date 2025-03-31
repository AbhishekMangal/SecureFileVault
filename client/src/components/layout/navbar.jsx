import React from 'react';
import { Link, useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

export function Navbar() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const { data: user, isLoading, isError } = useQuery({
    queryKey: ['/api/me'],
    enabled: !!localStorage.getItem('token'),
  });
  
  const handleLogout = async () => {
    try {
      await apiRequest('POST', '/api/logout');
      localStorage.removeItem('token');
      setLocation('/login');
      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
      });
    } catch (error) {
      toast({
        title: "Logout failed",
        description: "Something went wrong during logout.",
        variant: "destructive",
      });
    }
  };
  
  return (
    <nav className="bg-white shadow-sm border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/">
              <a className="flex items-center">
                <span className="material-icons text-primary text-3xl mr-2">enhanced_encryption</span>
                <span className="text-xl font-semibold">SecureTransfer</span>
              </a>
            </Link>
          </div>
          
          <div className="flex items-center">
            {isLoading ? (
              <div className="w-8 h-8 rounded-full bg-slate-200 animate-pulse"></div>
            ) : user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center space-x-2 bg-slate-100 hover:bg-slate-200 rounded-full py-1 px-3">
                    <span className="material-icons text-slate-600">account_circle</span>
                    <span className="text-sm font-medium">{user.username}</span>
                    <span className="material-icons text-slate-400 text-sm">arrow_drop_down</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleLogout}>
                    <span className="material-icons text-sm mr-2">logout</span>
                    <span>Logout</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex space-x-2">
                <Button variant="ghost" onClick={() => setLocation('/login')}>
                  Login
                </Button>
                <Button className="bg-primary text-white hover:bg-blue-700" onClick={() => setLocation('/register')}>
                  Register
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}