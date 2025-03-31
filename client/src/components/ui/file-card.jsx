import React from 'react';
import { formatFileSize, getFileTypeIcon, getFileTypeColor } from '@/lib/encryption';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

export function FileCard({
  id,
  fileName,
  fileSize,
  fileType,
  uploadDate,
  isEncrypted,
  onDelete,
  onRefresh
}) {
  const [showDetails, setShowDetails] = React.useState(false);
  const [fileDetails, setFileDetails] = React.useState(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const { toast } = useToast();
  
  const iconName = getFileTypeIcon(fileName);
  const iconColor = getFileTypeColor(fileName);
  const formattedDate = new Date(uploadDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
  
  const handleDownload = async () => {
    try {
      window.open(`/api/files/${id}/download`, '_blank');
    } catch (error) {
      toast({
        title: "Download failed",
        description: "Could not download the file. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  const handleViewDetails = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/files/${id}`);
      if (!response.ok) throw new Error('Failed to fetch file details');
      const data = await response.json();
      setFileDetails(data);
      setShowDetails(true);
    } catch (error) {
      toast({
        title: "Error",
        description: "Could not load file details.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleDelete = async () => {
    setIsLoading(true);
    try {
      await apiRequest('DELETE', `/api/files/${id}`);
      setShowDetails(false);
      onDelete(id);
      toast({
        title: "File deleted",
        description: "The file has been successfully deleted.",
      });
    } catch (error) {
      toast({
        title: "Deletion failed",
        description: "Could not delete the file. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <>
      <div className="group py-4 px-4 grid md:grid-cols-12 gap-4 items-center hover:bg-slate-50 rounded-md transition-colors">
        {/* Name and Status */}
        <div className="md:col-span-5 flex items-center">
          <span className={`material-icons ${iconColor}`}>{iconName}</span>
          <div className="ml-3">
            <div className="font-medium text-slate-800 truncate">{fileName}</div>
            <div className="flex items-center mt-1">
              {isEncrypted && (
                <span className="encrypted-badge text-xs font-medium text-green-700">Encrypted</span>
              )}
            </div>
          </div>
        </div>

        {/* Size */}
        <div className="md:col-span-2 text-sm text-slate-600">
          {formatFileSize(fileSize)}
        </div>

        {/* Upload Date */}
        <div className="md:col-span-3 text-sm text-slate-600">
          {formattedDate}
        </div>

        {/* Actions */}
        <div className="md:col-span-2 flex justify-end space-x-1">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleDownload}
                  className="p-1.5 text-slate-500 hover:bg-slate-200 rounded h-8 w-8"
                  disabled={isLoading}
                >
                  <span className="material-icons text-sm">download</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Download</p>
              </TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleViewDetails}
                  className="p-1.5 text-slate-500 hover:bg-slate-200 rounded h-8 w-8"
                  disabled={isLoading}
                >
                  <span className="material-icons text-sm">info</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Details</p>
              </TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleDelete}
                  className="p-1.5 text-slate-500 hover:bg-red-100 hover:text-red-500 rounded h-8 w-8"
                  disabled={isLoading}
                >
                  <span className="material-icons text-sm">delete</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Delete</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* File Details Dialog */}
      {fileDetails && (
        <Dialog open={showDetails} onOpenChange={setShowDetails}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-lg font-medium text-gray-900">File Details</DialogTitle>
              <DialogDescription>
                Information about the encrypted file
              </DialogDescription>
            </DialogHeader>

            <div className="mt-4">
              {/* File Info */}
              <div className="bg-slate-50 p-4 rounded-lg mb-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-slate-500">File Name</p>
                    <p className="font-medium">{fileDetails.originalName}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Type</p>
                    <p className="font-medium">{fileDetails.fileType.toUpperCase()}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Size</p>
                    <p className="font-medium">{formatFileSize(fileDetails.fileSize)}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Uploaded</p>
                    <p className="font-medium">
                      {new Date(fileDetails.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Encryption Details */}
              <div className="mb-4">
                <h4 className="text-sm font-medium mb-2">Encryption Details</h4>
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <div className="flex items-center mb-2">
                    <span className="material-icons text-green-600 mr-2">enhanced_encryption</span>
                    <span className="text-sm font-medium text-green-800">
                      {fileDetails.encryptionAlgorithm.toUpperCase()} Encryption
                    </span>
                  </div>
                  <p className="text-xs text-green-700">
                    This file is encrypted with industry-standard {fileDetails.encryptionAlgorithm.toUpperCase()} encryption algorithm. Only you can access it.
                  </p>
                </div>
              </div>
              
              {/* Access History */}
              {fileDetails.accessLogs && fileDetails.accessLogs.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Recent Access</h4>
                  <div className="text-sm border border-slate-200 rounded-lg divide-y">
                    {fileDetails.accessLogs.map((log, index) => (
                      <div key={index} className="p-3 flex justify-between">
                        <div>
                          <p className="font-medium">{log.action.charAt(0).toUpperCase() + log.action.slice(1)}</p>
                          <p className="text-slate-500 text-xs">From {log.ipAddress}</p>
                        </div>
                        <p className="text-slate-500">
                          {new Date(log.timestamp).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-6 flex justify-end space-x-3">
                <Button
                  variant="outline"
                  onClick={() => setShowDetails(false)}
                >
                  Close
                </Button>
                <Button
                  onClick={handleDownload}
                  className="bg-primary text-white hover:bg-blue-700"
                >
                  Download
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}