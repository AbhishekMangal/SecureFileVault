import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { FileCard } from "@/components/ui/file-card";
import { FileTable } from "@/components/ui/file-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useFiles } from "@/context/file-context";
import { useAuth } from "@/context/auth-context";
import { AlertCircle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { addWebSocketListener } from "@/lib/websocket";

export default function SharedFiles() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { downloadFile, viewEncryptedFile } = useFiles();
  const [activeTab, setActiveTab] = useState("shared-with-me");
  
  // Fetch files shared with user
  const { 
    data: sharedWithMe, 
    isLoading: sharedWithMeLoading, 
    error: sharedWithMeError
  } = useQuery({
    queryKey: ['/api/shared-files/with-me'],
    enabled: !!user,
  });
  
  // Fetch files shared by user
  const { 
    data: sharedByMe, 
    isLoading: sharedByMeLoading, 
    error: sharedByMeError 
  } = useQuery({
    queryKey: ['/api/shared-files/by-me'],
    enabled: !!user,
  });
  
  // Mark shared file as viewed
  const viewMutation = useMutation({
    mutationFn: async (sharedFileId: number) => {
      return apiRequest('POST', `/api/shared-files/view/${sharedFileId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/shared-files/with-me'] });
    }
  });
  
  // Set up WebSocket listener for new shared files
  useEffect(() => {
    if (user) {
      const cleanup = addWebSocketListener('FILE_SHARED_WITH_YOU', (data) => {
        queryClient.invalidateQueries({ queryKey: ['/api/shared-files/with-me'] });
      });
      
      return cleanup;
    }
  }, [user, queryClient]);
  
  // Mark files as viewed when tab is opened
  useEffect(() => {
    if (activeTab === "shared-with-me" && sharedWithMe) {
      const unviewedFiles = sharedWithMe.filter(item => !item.sharedFile.viewed);
      
      unviewedFiles.forEach(item => {
        viewMutation.mutate(item.sharedFile.id);
      });
    }
  }, [activeTab, sharedWithMe]);
  
  // Error handling
  const hasError = sharedWithMeError || sharedByMeError;
  const isLoading = sharedWithMeLoading || sharedByMeLoading;
  
  // Process data for display
  const sharedWithMeFiles = sharedWithMe?.map(item => ({
    id: item.file.id,
    name: item.file.name,
    originalName: item.file.originalName,
    type: item.file.type,
    size: item.file.size,
    hash: item.file.hash,
    uploadedAt: new Date(item.file.uploadedAt),
    encrypted: item.file.encrypted,
    sharedBy: {
      id: item.sharedByUser.id,
      username: item.sharedByUser.username,
      email: item.sharedByUser.email
    },
    permissionLevel: item.sharedFile.permissionLevel,
    isNew: !item.sharedFile.viewed
  })) || [];
  
  const sharedByMeFiles = sharedByMe?.map(item => ({
    id: item.file.id,
    name: item.file.name,
    originalName: item.file.originalName,
    type: item.file.type,
    size: item.file.size,
    hash: item.file.hash,
    uploadedAt: new Date(item.file.uploadedAt),
    encrypted: item.file.encrypted,
    sharedWith: [
      {
        id: item.sharedWithUser.id,
        username: item.sharedWithUser.username,
        email: item.sharedWithUser.email
      }
    ],
    permissionLevel: item.sharedFile.permissionLevel,
    viewed: item.sharedFile.viewed
  })) || [];
  
  // Handle download based on permission
  const handleDownload = (file) => {
    if (file.permissionLevel === "view") {
      toast({
        title: "Permission Denied",
        description: "You only have view access to this file.",
        variant: "destructive"
      });
      return;
    }
    
    downloadFile(file.id);
  };
  
  // Handle file card actions
  const handleFileCardView = (file) => {
    viewEncryptedFile(file.id);
  };
  
  const handleFileCardDownload = (file) => {
    handleDownload(file);
  };

  return (
    <DashboardLayout>
      {hasError && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            There was an error loading shared files. Please try again.
          </AlertDescription>
        </Alert>
      )}
      
      <Tabs defaultValue="shared-with-me" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="shared-with-me">
            Shared with me
            {sharedWithMe && sharedWithMe.some(item => !item.sharedFile.viewed) && (
              <Badge variant="default" className="ml-2 bg-blue-500 hover:bg-blue-600">
                {sharedWithMe.filter(item => !item.sharedFile.viewed).length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="shared-by-me">Files I've shared</TabsTrigger>
        </TabsList>
        
        <TabsContent value="shared-with-me">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex justify-between items-center">
                <span>Files shared with me</span>
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <span>Last updated: {isLoading ? "Loading..." : "Just now"}</span>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8"
                    onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/shared-files/with-me'] })}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8 text-gray-500">Loading shared files...</div>
              ) : sharedWithMeFiles.length === 0 ? (
                <div className="text-center py-8 text-gray-500">No files have been shared with you yet</div>
              ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {sharedWithMeFiles.map((file) => (
                    <FileCard
                      key={`${file.id}-${file.sharedBy.id}`}
                      id={file.id}
                      name={file.name}
                      originalName={file.originalName}
                      type={file.type}
                      size={file.size}
                      hash={file.hash}
                      encrypted={file.encrypted}
                      sharedBy={file.sharedBy.username}
                      sharedAt={file.uploadedAt}
                      isNew={file.isNew}
                      onView={() => handleFileCardView(file)}
                      onDownload={() => handleFileCardDownload(file)}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="shared-by-me">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Files I've shared</CardTitle>
            </CardHeader>
            <CardContent>
              <FileTable 
                files={sharedByMeFiles}
                isLoading={isLoading}
                type="shared"
                showActions={true}
                onManage={(file) => {
                  toast({
                    title: "Managing shared file",
                    description: `Managing access for ${file.originalName}`,
                  });
                }}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
}
