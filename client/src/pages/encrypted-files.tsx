import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { FileTable } from "@/components/ui/file-table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useFiles } from "@/context/file-context";
import { AlertCircle, Search } from "lucide-react";

export default function EncryptedFiles() {
  const { viewEncryptedFile, downloadFile, deleteFile } = useFiles();
  const [searchTerm, setSearchTerm] = useState("");
  
  // Fetch files
  const { data: files, isLoading, error } = useQuery({
    queryKey: ['/api/files'],
  });
  
  // Filter encrypted files
  const encryptedFiles = files 
    ? files
        .filter(file => file.encrypted && file.originalName.toLowerCase().includes(searchTerm.toLowerCase()))
        .map(file => ({
          ...file,
          uploadedAt: new Date(file.uploadedAt)
        }))
    : [];

  return (
    <DashboardLayout>
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            There was an error loading your encrypted files. Please try again.
          </AlertDescription>
        </Alert>
      )}
      
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-900">Encrypted Files</h3>
          <div className="relative w-64">
            <Input
              className="pl-8"
              placeholder="Search files..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
          </div>
        </div>
        
        <div className="p-5">
          <FileTable 
            files={encryptedFiles}
            isLoading={isLoading}
            type="encrypted"
            showActions={true}
            onView={(file) => viewEncryptedFile(file.id)}
            onDownload={(file) => downloadFile(file.id)}
            onShare={(file) => shareFile(file.id, file.originalName)}
            onDelete={(file) => deleteFile(file.id)}
            onDecrypt={(file) => {
              // For now, this just downloads the file
              // In a real implementation, this would decrypt and then download
              downloadFile(file.id);
            }}
          />
        </div>
      </div>
      
      <div className="mt-6 bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">About Encryption</h3>
        </div>
        <div className="p-5">
          <div className="prose max-w-none">
            <p>
              All your files are encrypted using AES-256, a government and industry standard encryption algorithm.
              Your files are encrypted before they are uploaded, ensuring maximum security.
            </p>
            
            <h4 className="text-base font-medium mt-4">Key Security Features:</h4>
            <ul className="mt-2">
              <li>End-to-end encryption ensures only you have access to your files.</li>
              <li>SHA-256 hashing verifies file integrity and prevents tampering.</li>
              <li>RSA public/private key pairs for secure authentication.</li>
              <li>Files are encrypted locally before transmission.</li>
            </ul>
            
            <div className="mt-4 p-4 bg-gray-50 rounded-md border border-gray-200">
              <h5 className="font-medium">Encryption Process:</h5>
              <ol className="mt-2 space-y-1 text-sm">
                <li>1. A unique encryption key is generated for each file.</li>
                <li>2. The file is encrypted using AES-256 with the generated key.</li>
                <li>3. A SHA-256 hash of the original file is created to verify integrity.</li>
                <li>4. The encrypted file is transmitted securely over HTTPS.</li>
                <li>5. Your file remains encrypted in storage until you access it.</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
