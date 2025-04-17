import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatFileSize } from "@/lib/crypto";
import { 
  Download, Eye, Share2, Trash2, FileText, 
  FileImage, FileArchive, FileSpreadsheet, 
  FileCode, FileAudio, FileVideo, LockOpen,
  ShieldCheck
} from "lucide-react";

export interface FileTableItem {
  id: number;
  name: string;
  originalName: string;
  type: string;
  size: number;
  hash: string;
  uploadedAt: Date;
  encrypted: boolean;
  encryptionType?: string;
  sharedBy?: {
    id: number;
    username: string;
    email: string;
  };
  sharedWith?: Array<{
    id: number;
    username: string;
    email: string;
  }>;
  permissionLevel?: string;
}

export interface FileTableProps {
  files: FileTableItem[];
  type?: "standard" | "encrypted" | "shared";
  showActions?: boolean;
  onView?: (file: FileTableItem) => void;
  onDownload?: (file: FileTableItem) => void;
  onShare?: (file: FileTableItem) => void;
  onDelete?: (file: FileTableItem) => void;
  onDecrypt?: (file: FileTableItem) => void;
  onManage?: (file: FileTableItem) => void;
}

export function FileTable({
  files,
  type = "standard",
  showActions = true,
  onView,
  onDownload,
  onShare,
  onDelete,
  onDecrypt,
  onManage
}: FileTableProps) {
  // Function to determine file icon based on type
  const getFileIcon = (fileType: string) => {
    if (fileType.includes("pdf")) return <FileText className="h-5 w-5 text-red-500" />;
    if (fileType.includes("image")) return <FileImage className="h-5 w-5 text-blue-500" />;
    if (fileType.includes("zip") || fileType.includes("rar") || fileType.includes("tar")) 
      return <FileArchive className="h-5 w-5 text-yellow-500" />;
    if (fileType.includes("excel") || fileType.includes("spreadsheet") || fileType.includes("csv")) 
      return <FileSpreadsheet className="h-5 w-5 text-green-500" />;
    if (fileType.includes("html") || fileType.includes("javascript") || fileType.includes("json")) 
      return <FileCode className="h-5 w-5 text-purple-500" />;
    if (fileType.includes("audio")) return <FileAudio className="h-5 w-5 text-orange-500" />;
    if (fileType.includes("video")) return <FileVideo className="h-5 w-5 text-pink-500" />;
    return <FileText className="h-5 w-5 text-gray-500" />;
  };

  // Format date
  const formatDate = (date: Date) => {
    const now = new Date();
    const fileDate = new Date(date);
    
    // Today
    if (fileDate.toDateString() === now.toDateString()) {
      return `Today, ${fileDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    
    // Yesterday
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    if (fileDate.toDateString() === yesterday.toDateString()) {
      return `Yesterday, ${fileDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    
    // Other dates
    return fileDate.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>{type === "encrypted" ? "Encryption" : "Size"}</TableHead>
            <TableHead>{type === "shared" ? "Shared With" : "Date"}</TableHead>
            <TableHead>{type === "shared" ? "Access" : "Status"}</TableHead>
            {showActions && <TableHead className="text-right">Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {files.length === 0 ? (
            <TableRow>
              <TableCell colSpan={showActions ? 5 : 4} className="text-center py-8 text-gray-500">
                No files found
              </TableCell>
            </TableRow>
          ) : (
            files.map((file) => (
              <TableRow key={file.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center">
                    {getFileIcon(file.type)}
                    <div className="ml-3">
                      <div className="text-sm font-medium text-gray-900">{file.originalName}</div>
                      {type !== "shared" && (
                        <div className="text-xs text-gray-500">SHA-256: {file.hash.substring(0, 6)}...</div>
                      )}
                      {file.sharedBy && (
                        <div className="text-xs text-gray-500">
                          Shared by: {file.sharedBy.username}
                        </div>
                      )}
                    </div>
                  </div>
                </TableCell>
                
                <TableCell>
                  {type === "encrypted" ? (
                    <div className="text-sm text-gray-900">{file.encryptionType || "AES-256"}</div>
                  ) : (
                    <div className="text-sm text-gray-900">{formatFileSize(file.size)}</div>
                  )}
                </TableCell>
                
                <TableCell>
                  {type === "shared" && file.sharedWith ? (
                    <div className="flex -space-x-2">
                      {file.sharedWith.map((user, idx) => (
                        <Tooltip key={user.id}>
                          <TooltipTrigger asChild>
                            <Avatar className="h-6 w-6 border-2 border-white">
                              <AvatarFallback>{user.username.substring(0, 2).toUpperCase()}</AvatarFallback>
                            </Avatar>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{user.username}</p>
                          </TooltipContent>
                        </Tooltip>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-gray-900">{formatDate(file.uploadedAt)}</div>
                  )}
                </TableCell>
                
                <TableCell>
                  {type === "shared" ? (
                    <Badge 
                      variant="secondary" 
                      className={`${
                        file.permissionLevel === "full" 
                          ? "bg-green-100 text-green-800" 
                          : "bg-blue-100 text-blue-800"
                      } hover:bg-opacity-90`}
                    >
                      {file.permissionLevel === "full" ? "Full access" : file.permissionLevel === "download" ? "Download" : "View only"}
                    </Badge>
                  ) : (
                    <Badge 
                      variant="secondary" 
                      className={`${
                        file.encrypted 
                          ? "bg-green-100 text-green-800" 
                          : "bg-yellow-100 text-yellow-800"
                      } hover:bg-opacity-90`}
                    >
                      {file.encrypted ? "Encrypted" : "Unencrypted"}
                    </Badge>
                  )}
                </TableCell>
                
                {showActions && (
                  <TableCell className="text-right">
                    <div className="flex space-x-2 justify-end">
                      <TooltipProvider>
                        {type === "shared" && onManage ? (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 text-blue-600 hover:text-blue-800"
                                onClick={() => onManage(file)}
                              >
                                <ShieldCheck className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Manage access</p>
                            </TooltipContent>
                          </Tooltip>
                        ) : (
                          <>
                            {onShare && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-8 w-8 text-blue-600 hover:text-blue-800"
                                    onClick={() => onShare(file)}
                                  >
                                    <Share2 className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Share</p>
                                </TooltipContent>
                              </Tooltip>
                            )}
                            
                            {onDownload && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-8 w-8 text-gray-600 hover:text-gray-800"
                                    onClick={() => onDownload(file)}
                                  >
                                    <Download className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Download</p>
                                </TooltipContent>
                              </Tooltip>
                            )}
                            
                            {onView && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-8 w-8 text-gray-600 hover:text-gray-800"
                                    onClick={() => onView(file)}
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>View</p>
                                </TooltipContent>
                              </Tooltip>
                            )}
                            
                            {type === "encrypted" && onDecrypt && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-8 w-8 text-gray-600 hover:text-gray-800"
                                    onClick={() => onDecrypt(file)}
                                  >
                                    <LockOpen className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Download decrypted</p>
                                </TooltipContent>
                              </Tooltip>
                            )}
                            
                            {onDelete && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-8 w-8 text-red-600 hover:text-red-800"
                                    onClick={() => onDelete(file)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Delete</p>
                                </TooltipContent>
                              </Tooltip>
                            )}
                          </>
                        )}
                      </TooltipProvider>
                    </div>
                  </TableCell>
                )}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
