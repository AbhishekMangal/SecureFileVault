import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { ProgressBar } from '@/components/ui/progress-bar';
import { ALGORITHMS } from '@/lib/encryption';
import { queryClient } from '@/lib/queryClient';

interface FileUploadProps {
  onFileUploaded: () => void;
}

export function FileUpload({ onFileUploaded }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [algorithm, setAlgorithm] = useState(ALGORITHMS.AES_256);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [recentUploads, setRecentUploads] = useState<{
    name: string;
    timestamp: Date;
  }[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleFileSelect = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const uploadFile = async () => {
    if (!selectedFile) return;
    
    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('algorithm', algorithm);
    
    setIsUploading(true);
    setUploadProgress(0);
    
    try {
      // Simulate progress for better UX (actual progress would require server events)
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          const newProgress = prev + (Math.random() * 10);
          return newProgress > 90 ? 90 : newProgress;
        });
      }, 300);
      
      const response = await fetch('/api/files/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      
      clearInterval(progressInterval);
      
      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Upload failed');
      }
      
      setUploadProgress(100);
      
      // Add to recent uploads
      const newUpload = {
        name: selectedFile.name,
        timestamp: new Date(),
      };
      
      setRecentUploads(prev => [newUpload, ...prev].slice(0, 5));
      setSelectedFile(null);
      
      // Invalidate files query to refresh the list
      queryClient.invalidateQueries({ queryKey: ['/api/files'] });
      
      toast({
        title: "Upload successful",
        description: "Your file has been encrypted and uploaded.",
      });
      
      onFileUploaded();
    } catch (error) {
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "An error occurred during upload",
        variant: "destructive",
      });
    } finally {
      setTimeout(() => {
        setIsUploading(false);
        setUploadProgress(0);
      }, 500);
    }
  };

  return (
    <Card className="bg-white rounded-xl shadow-sm border border-slate-200">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold flex items-center">
          <span className="material-icons text-primary mr-2">upload_file</span>
          Upload Files
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Upload Dropzone */}
        <div
          className={`file-drop-zone rounded-lg p-8 mb-4 text-center cursor-pointer ${
            isDragging ? 'active' : ''
          }`}
          onClick={handleFileSelect}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            onChange={handleFileInputChange}
          />
          <div className="flex flex-col items-center">
            <span className="material-icons text-slate-400 text-4xl mb-2">
              cloud_upload
            </span>
            <p className="text-sm font-medium text-slate-700 mb-1">
              {selectedFile ? selectedFile.name : "Drag & drop files here"}
            </p>
            <p className="text-xs text-slate-500">
              {selectedFile ? `${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB` : "or click to browse"}
            </p>
            
            {selectedFile && (
              <Button 
                className="mt-4 bg-primary hover:bg-blue-700 text-white"
                onClick={(e) => {
                  e.stopPropagation();
                  uploadFile();
                }}
                disabled={isUploading}
              >
                {isUploading ? "Encrypting..." : "Encrypt & Upload"}
              </Button>
            )}
            
            {isUploading && (
              <div className="w-full mt-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-blue-700">
                    {uploadProgress < 100 ? "Encrypting..." : "Complete!"} {Math.round(uploadProgress)}%
                  </span>
                </div>
                <ProgressBar value={uploadProgress} max={100} />
              </div>
            )}
          </div>
        </div>
        
        {/* Encryption Options */}
        <div className="bg-slate-50 rounded-lg p-4 mb-4">
          <h3 className="text-sm font-medium mb-3 flex items-center">
            <span className="material-icons text-slate-600 text-sm mr-1">settings</span>
            Encryption Options
          </h3>
          
          <RadioGroup 
            defaultValue={algorithm} 
            onValueChange={setAlgorithm}
            className="space-y-3"
          >
            <div className="flex items-center">
              <RadioGroupItem value={ALGORITHMS.AES_256} id="aes256" />
              <Label htmlFor="aes256" className="ml-2 text-sm text-slate-700 flex items-center">
                AES-256
                <span className="bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded ml-2">Recommended</span>
              </Label>
            </div>
            <div className="flex items-center">
              <RadioGroupItem value={ALGORITHMS.RSA_2048} id="rsa" />
              <Label htmlFor="rsa" className="ml-2 text-sm text-slate-700">RSA-2048</Label>
            </div>
          </RadioGroup>
        </div>
        
        {/* Recent Uploads */}
        <div>
          <h3 className="text-sm font-medium mb-3">Recent Uploads</h3>
          
          <div className="space-y-2">
            {recentUploads.length === 0 ? (
              <p className="text-sm text-slate-500 py-2">No recent uploads</p>
            ) : (
              recentUploads.map((upload, index) => (
                <div key={index} className="flex items-center p-2 rounded-lg hover:bg-slate-50 text-sm">
                  <span className="material-icons text-slate-400 mr-2">insert_drive_file</span>
                  <span className="font-medium text-slate-700 truncate flex-grow">{upload.name}</span>
                  <span className="text-xs text-slate-500">
                    {upload.timestamp.getTime() > Date.now() - 60000
                      ? 'Just now'
                      : upload.timestamp.getTime() > Date.now() - 3600000
                      ? `${Math.round((Date.now() - upload.timestamp.getTime()) / 60000)} mins ago`
                      : `${Math.round((Date.now() - upload.timestamp.getTime()) / 3600000)} hours ago`}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
