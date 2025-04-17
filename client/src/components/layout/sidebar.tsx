import React from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/context/auth-context";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { BarChart2, FileText, Share2, Lock, Key, LogOut } from "lucide-react";

interface SidebarProps {
  sharedFilesCount?: number;
}

export function Sidebar({ sharedFilesCount = 0 }: SidebarProps) {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  
  // Fetch shared files count
  const { data: sharedFiles } = useQuery({
    queryKey: ['/api/shared-files/with-me'],
    enabled: !!user,
  });
  
  // Calculate unviewed files
  const unviewedCount = sharedFiles?.filter(sf => !sf.sharedFile.viewed).length || sharedFilesCount;
  
  // Get first name and last name initials for avatar
  const getInitials = () => {
    if (!user) return "U";
    
    if (user.firstName && user.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`;
    }
    
    return user.username.substring(0, 2).toUpperCase();
  };

  return (
    <div className="flex flex-col fixed inset-y-0 left-0 w-64 bg-gray-800 shadow-lg">
      {/* Logo */}
      <div className="flex items-center h-16 px-4 bg-gray-900">
        <svg 
          className="h-8 w-auto text-white" 
          viewBox="0 0 24 24" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M14 14V8L19 4M10 14V8L5 4M12 14V8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M5 20V14L12 20L19 14V20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <h1 className="ml-2 text-xl font-bold text-white">SecureTransfer</h1>
      </div>
      
      {/* Navigation */}
      <nav className="flex-1 pt-5 pb-4 overflow-y-auto">
        <div className="px-2 space-y-1">
          <Link href="/dashboard">
            <a className={`flex items-center px-2 py-2 text-base font-medium rounded-md ${
              location === "/dashboard" 
                ? "text-white bg-gray-900" 
                : "text-gray-300 hover:bg-gray-700 hover:text-white"
            } group`}>
              <BarChart2 className={`mr-3 h-6 w-6 ${
                location === "/dashboard" ? "text-blue-400" : "text-gray-400 group-hover:text-blue-400"
              }`} />
              Dashboard
            </a>
          </Link>
          
          <Link href="/my-files">
            <a className={`flex items-center px-2 py-2 text-base font-medium rounded-md ${
              location === "/my-files" 
                ? "text-white bg-gray-900" 
                : "text-gray-300 hover:bg-gray-700 hover:text-white"
            } group`}>
              <FileText className={`mr-3 h-6 w-6 ${
                location === "/my-files" ? "text-blue-400" : "text-gray-400 group-hover:text-blue-400"
              }`} />
              My Files
            </a>
          </Link>
          
          <Link href="/shared-files">
            <a className={`flex items-center px-2 py-2 text-base font-medium rounded-md ${
              location === "/shared-files" 
                ? "text-white bg-gray-900" 
                : "text-gray-300 hover:bg-gray-700 hover:text-white"
            } group`}>
              <Share2 className={`mr-3 h-6 w-6 ${
                location === "/shared-files" ? "text-blue-400" : "text-gray-400 group-hover:text-blue-400"
              }`} />
              Shared Files
              {unviewedCount > 0 && (
                <Badge variant="default" className="ml-auto bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                  {unviewedCount}
                </Badge>
              )}
            </a>
          </Link>
          
          <Link href="/encrypted-files">
            <a className={`flex items-center px-2 py-2 text-base font-medium rounded-md ${
              location === "/encrypted-files" 
                ? "text-white bg-gray-900" 
                : "text-gray-300 hover:bg-gray-700 hover:text-white"
            } group`}>
              <Lock className={`mr-3 h-6 w-6 ${
                location === "/encrypted-files" ? "text-blue-400" : "text-gray-400 group-hover:text-blue-400"
              }`} />
              Encrypted Files
            </a>
          </Link>
          
          <Link href="/security-keys">
            <a className={`flex items-center px-2 py-2 text-base font-medium rounded-md ${
              location === "/security-keys" 
                ? "text-white bg-gray-900" 
                : "text-gray-300 hover:bg-gray-700 hover:text-white"
            } group`}>
              <Key className={`mr-3 h-6 w-6 ${
                location === "/security-keys" ? "text-blue-400" : "text-gray-400 group-hover:text-blue-400"
              }`} />
              Security Keys
            </a>
          </Link>
        </div>
      </nav>
      
      {/* User Profile */}
      <div className="flex items-center px-4 py-3 bg-gray-900">
        <div className="flex-shrink-0">
          <Avatar>
            <AvatarFallback>{getInitials()}</AvatarFallback>
            {user?.email && (
              <AvatarImage src={`https://www.gravatar.com/avatar/${btoa(user.email)}?d=mp`} />
            )}
          </Avatar>
        </div>
        <div className="ml-3">
          <p className="text-sm font-medium text-white">
            {user?.firstName && user?.lastName
              ? `${user.firstName} ${user.lastName}`
              : user?.username || "User"}
          </p>
          <div className="flex items-center">
            <div className="h-2 w-2 rounded-full bg-green-400"></div>
            <p className="text-xs font-medium text-gray-300 ml-1">Online</p>
          </div>
        </div>
        <Button 
          variant="ghost" 
          size="icon" 
          className="ml-auto text-gray-400 hover:text-gray-100"
          onClick={logout}
        >
          <LogOut className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}
