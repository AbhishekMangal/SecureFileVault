import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Lock } from "lucide-react";
import { formatFileSize } from "@/lib/crypto";

interface ViewEncryptedModalProps {
  isOpen: boolean;
  onClose: () => void;
  file: {
    id: number;
    name: string;
    originalName: string;
    size: number;
    hash: string;
    encryptionType: string;
    encryptedContent?: string;
  } | null;
}

export function ViewEncryptedModal({
  isOpen,
  onClose,
  file
}: ViewEncryptedModalProps) {
  if (!file) return null;

  // Generate mock encrypted content for viewing
  const generateEncryptedContent = () => {
    const mockEncrypted = [];
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
    
    // Generate random base64-like content based on file hash for consistency
    const seed = file.hash.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
    const lines = Math.min(20, Math.ceil(file.size / 512)); // Reasonable number of lines
    
    for (let i = 0; i < lines; i++) {
      let line = '';
      const lineLength = 64 + (i % 8);
      
      for (let j = 0; j < lineLength; j++) {
        // Use a deterministic but seemingly random approach
        const index = (seed * (i + 1) * (j + 1)) % chars.length;
        line += chars[index];
      }
      
      mockEncrypted.push(line);
    }
    
    return mockEncrypted.join('\n');
  };

  const encryptedContent = file.encryptedContent || generateEncryptedContent();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center">
            <div className="bg-green-100 p-2 rounded-full mr-3">
              <Lock className="h-5 w-5 text-green-600" />
            </div>
            <DialogTitle>Encrypted File: {file.originalName}</DialogTitle>
          </div>
          <DialogDescription>
            View the encrypted content of your file. This is what will be transmitted.
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="bg-gray-100 rounded-md p-4 font-mono text-xs h-60 overflow-auto">
          <div className="text-gray-700 whitespace-pre-wrap">{encryptedContent}</div>
        </ScrollArea>
        
        <div className="bg-gray-50 rounded-md p-3">
          <div className="flex justify-between text-xs text-gray-500">
            <div>Encryption: {file.encryptionType || "AES-256"}</div>
            <div>Size: {formatFileSize(file.size)}</div>
          </div>
          <div className="mt-2 text-xs text-gray-500">
            SHA-256: {file.hash}
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
