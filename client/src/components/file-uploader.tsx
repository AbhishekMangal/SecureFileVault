import React, { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useFiles } from "@/context/file-context";
import { Upload, Lock } from "lucide-react";

export function FileUploader() {
  const { uploadFile, isUploading, uploadProgress } = useFiles();
  const { toast } = useToast();
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle file selection
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      await uploadSelectedFile(files[0]);
    }
  };

  // Handle file selection from drop
  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await uploadSelectedFile(e.dataTransfer.files[0]);
    }
  };

  // Handle drag events
  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  // Trigger file input click
  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  // Upload the selected file
  const uploadSelectedFile = async (file: File) => {
    try {
      // Check file size (max 50MB)
      if (file.size > 50 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Maximum file size is 50MB",
          variant: "destructive",
        });
        return;
      }

      await uploadFile(file, (progress) => {
        // Progress is handled by the file context
      });
      
      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      console.error("Upload error:", error);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle>Upload Files</CardTitle>
        <CardDescription>Files will be automatically encrypted</CardDescription>
      </CardHeader>
      <CardContent>
        <div
          className={`max-w-lg flex justify-center px-6 pt-5 pb-6 border-2 ${
            dragActive ? "border-blue-300 bg-blue-50" : "border-gray-300 border-dashed"
          } rounded-md mx-auto`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <div className="space-y-1 text-center">
            <Upload className="mx-auto h-12 w-12 text-gray-400" />
            <div className="flex text-sm text-gray-600">
              <label
                htmlFor="file-upload"
                className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none"
              >
                <span>Upload a file</span>
                <input
                  id="file-upload"
                  name="file-upload"
                  type="file"
                  className="sr-only"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  disabled={isUploading}
                />
              </label>
              <p className="pl-1">or drag and drop</p>
            </div>
            <p className="text-xs text-gray-500">
              Files will be automatically encrypted
            </p>
          </div>
        </div>
        
        {isUploading && (
          <div className="mt-4">
            <div className="flex justify-between text-sm text-gray-500 mb-1">
              <span>Uploading...</span>
              <span>{uploadProgress}%</span>
            </div>
            <Progress value={uploadProgress} className="h-2" />
          </div>
        )}
        
        <div className="mt-4 flex justify-center">
          <Button
            onClick={handleButtonClick}
            disabled={isUploading}
            className="flex items-center"
          >
            <Lock className="mr-2 h-4 w-4" />
            Encrypt &amp; Upload
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
