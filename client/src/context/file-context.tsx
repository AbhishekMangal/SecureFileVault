import React, { createContext, useContext, useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "./auth-context";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { initializeWebSocket, addWebSocketListener } from "@/lib/websocket";
import { ShareFileModal } from "@/components/modals/share-file-modal";
import { ViewEncryptedModal } from "@/components/modals/view-encrypted-modal";

interface FileContextType {
  uploadFile: (file: File, onProgress?: (progress: number) => void) => Promise<void>;
  deleteFile: (fileId: number) => Promise<void>;
  downloadFile: (fileId: number) => Promise<void>;
  viewEncryptedFile: (fileId: number) => void;
  shareFile: (fileId: number, fileName: string) => void;
  isUploading: boolean;
  uploadProgress: number;
}

const FileContext = createContext<FileContextType | null>(null);

export function FileProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Upload state
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  // Modal state
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [viewEncryptedModalOpen, setViewEncryptedModalOpen] = useState(false);
  const [selectedFileId, setSelectedFileId] = useState<number | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [selectedEncryptedFile, setSelectedEncryptedFile] = useState<any>(null);
  
  // Setup WebSocket
  useEffect(() => {
    if (user) {
      const ws = initializeWebSocket(user.id.toString());
      
      // Add listeners for various events
      const fileUploadedCleanup = addWebSocketListener('FILE_UPLOADED', (data) => {
        queryClient.invalidateQueries({ queryKey: ['/api/files'] });
        queryClient.invalidateQueries({ queryKey: ['/api/users/stats'] });
      });
      
      const fileDeletedCleanup = addWebSocketListener('FILE_DELETED', (data) => {
        queryClient.invalidateQueries({ queryKey: ['/api/files'] });
        queryClient.invalidateQueries({ queryKey: ['/api/users/stats'] });
      });
      
      const fileSharedCleanup = addWebSocketListener('FILE_SHARED_WITH_YOU', (data) => {
        queryClient.invalidateQueries({ queryKey: ['/api/shared-files/with-me'] });
        queryClient.invalidateQueries({ queryKey: ['/api/users/stats'] });
        
        toast({
          title: "New file shared with you",
          description: `${data.sharedByUser.username} shared a file with you: ${data.file.originalName}`,
        });
      });
      
      return () => {
        fileUploadedCleanup();
        fileDeletedCleanup();
        fileSharedCleanup();
      };
    }
  }, [user, queryClient, toast]);
  
  // Upload file function
  const uploadFile = async (file: File, onProgress?: (progress: number) => void) => {
    setIsUploading(true);
    setUploadProgress(0);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      // Create an XMLHttpRequest to track progress
      const xhr = new XMLHttpRequest();
      const promise = new Promise<void>((resolve, reject) => {
        xhr.open('POST', '/api/files/upload');
        xhr.withCredentials = true;
        
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const progress = Math.round((event.loaded / event.total) * 100);
            setUploadProgress(progress);
            if (onProgress) onProgress(progress);
          }
        };
        
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve();
          } else {
            reject(new Error(xhr.responseText || 'Upload failed'));
          }
        };
        
        xhr.onerror = () => {
          reject(new Error('Network error'));
        };
        
        xhr.send(formData);
      });
      
      await promise;
      
      // Invalidate queries to refresh data
      await queryClient.invalidateQueries({ queryKey: ['/api/files'] });
      await queryClient.invalidateQueries({ queryKey: ['/api/users/stats'] });
      
      toast({
        title: "File uploaded successfully",
        description: `${file.name} has been encrypted and uploaded`,
      });
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload file",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };
  
  // Delete file mutation
  const deleteMutation = useMutation({
    mutationFn: async (fileId: number) => {
      return apiRequest('DELETE', `/api/files/${fileId}`);
    },
    onSuccess: () => {
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/files'] });
      queryClient.invalidateQueries({ queryKey: ['/api/users/stats'] });
      
      toast({
        title: "File deleted",
        description: "The file has been deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Delete failed",
        description: error instanceof Error ? error.message : "Failed to delete file",
        variant: "destructive",
      });
    }
  });
  
  // Delete file function
  const deleteFile = async (fileId: number) => {
    await deleteMutation.mutateAsync(fileId);
  };
  
  // Download file function
  const downloadFile = async (fileId: number) => {
    try {
      // Create a link element and trigger the download
      const link = document.createElement('a');
      link.href = `/api/files/${fileId}/download`;
      link.setAttribute('download', '');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: "Download failed",
        description: error instanceof Error ? error.message : "Failed to download file",
        variant: "destructive",
      });
    }
  };
  
  // View encrypted file function
  const viewEncryptedFile = async (fileId: number) => {
    try {
      const response = await apiRequest('GET', `/api/files/${fileId}`);
      const file = await response.json();
      setSelectedEncryptedFile(file);
      setViewEncryptedModalOpen(true);
    } catch (error) {
      console.error('View encrypted file error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to view encrypted file",
        variant: "destructive",
      });
    }
  };
  
  // Share file function
  const shareFile = (fileId: number, fileName: string) => {
    setSelectedFileId(fileId);
    setSelectedFileName(fileName);
    setShareModalOpen(true);
  };
  
  const value = {
    uploadFile,
    deleteFile,
    downloadFile,
    viewEncryptedFile,
    shareFile,
    isUploading,
    uploadProgress,
  };
  
  return (
    <FileContext.Provider value={value}>
      {children}
      <ShareFileModal 
        isOpen={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        fileId={selectedFileId}
        fileName={selectedFileName}
        onShareComplete={() => {
          queryClient.invalidateQueries({ queryKey: ['/api/shared-files/by-me'] });
        }}
      />
      <ViewEncryptedModal 
        isOpen={viewEncryptedModalOpen}
        onClose={() => setViewEncryptedModalOpen(false)}
        file={selectedEncryptedFile}
      />
    </FileContext.Provider>
  );
}

export function useFiles() {
  const context = useContext(FileContext);
  if (!context) {
    throw new Error("useFiles must be used within a FileProvider");
  }
  return context;
}
