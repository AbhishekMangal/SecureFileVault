import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { FileTable } from "@/components/ui/file-table";
import { FileUploader } from "@/components/file-uploader";
import { useFiles } from "@/context/file-context";
import { Button } from "@/components/ui/button";
import { AlertCircle, Filter } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function MyFiles() {
  const { viewEncryptedFile, shareFile, downloadFile, deleteFile } = useFiles();
  
  // Filter and search state
  const [searchTerm, setSearchTerm] = useState("");
  const [showEncrypted, setShowEncrypted] = useState(true);
  const [showUnencrypted, setShowUnencrypted] = useState(true);
  
  // Deletion confirmation
  const [fileToDelete, setFileToDelete] = useState<number | null>(null);
  
  // Fetch files
  const { data: files, isLoading, error } = useQuery({
    queryKey: ['/api/files'],
  });
  
  // Filter files based on search and filters
  const filteredFiles = files ? files.filter(file => {
    const matchesSearch = file.originalName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesEncryption = 
      (showEncrypted && file.encrypted) || 
      (showUnencrypted && !file.encrypted);
    
    return matchesSearch && matchesEncryption;
  }) : [];
  
  // Handle delete confirmation
  const handleDeleteClick = (fileId: number) => {
    setFileToDelete(fileId);
  };
  
  const handleConfirmDelete = async () => {
    if (fileToDelete !== null) {
      await deleteFile(fileToDelete);
      setFileToDelete(null);
    }
  };

  return (
    <DashboardLayout>
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            There was an error loading your files. Please try again.
          </AlertDescription>
        </Alert>
      )}
      
      {/* Upload Section */}
      <div className="mb-6">
        <FileUploader />
      </div>
      
      {/* Search and filters */}
      <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-3">
        <div className="w-full sm:w-80">
          <Input
            placeholder="Search files..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="ml-auto">
              <Filter className="mr-2 h-4 w-4" />
              Filter
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Filter by</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuCheckboxItem
              checked={showEncrypted}
              onCheckedChange={setShowEncrypted}
            >
              Show encrypted files
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={showUnencrypted}
              onCheckedChange={setShowUnencrypted}
            >
              Show unencrypted files
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      {/* Files Table */}
      <FileTable 
        files={filteredFiles}
        isLoading={isLoading}
        type="standard"
        showActions={true}
        onView={(file) => viewEncryptedFile(file.id)}
        onDownload={(file) => downloadFile(file.id)}
        onShare={(file) => shareFile(file.id, file.originalName)}
        onDelete={(file) => handleDeleteClick(file.id)}
      />
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={fileToDelete !== null} onOpenChange={() => setFileToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the file. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
