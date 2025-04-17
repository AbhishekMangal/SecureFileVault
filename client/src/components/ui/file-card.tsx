import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { formatFileSize } from "@/lib/crypto";
import { 
  Download, Eye, Share2, Trash2, FileText, 
  FileImage, FileArchive, FileSpreadsheet, 
  FileCode, FileAudio, FileVideo 
} from "lucide-react";

export interface FileCardProps {
  id: number;
  name: string;
  originalName: string;
  type: string;
  size: number;
  hash: string;
  encrypted: boolean;
  sharedBy?: string;
  sharedAt?: Date;
  isNew?: boolean;
  onView?: () => void;
  onDownload?: () => void;
  onShare?: () => void;
  onDelete?: () => void;
}

export function FileCard({
  id,
  name,
  originalName,
  type,
  size,
  hash,
  encrypted,
  sharedBy,
  sharedAt,
  isNew = false,
  onView,
  onDownload,
  onShare,
  onDelete
}: FileCardProps) {
  // Function to determine file icon based on type
  const getFileIcon = () => {
    if (type.includes("pdf")) return <FileText className="h-6 w-6 text-red-500" />;
    if (type.includes("image")) return <FileImage className="h-6 w-6 text-blue-500" />;
    if (type.includes("zip") || type.includes("rar") || type.includes("tar")) 
      return <FileArchive className="h-6 w-6 text-yellow-500" />;
    if (type.includes("excel") || type.includes("spreadsheet") || type.includes("csv")) 
      return <FileSpreadsheet className="h-6 w-6 text-green-500" />;
    if (type.includes("html") || type.includes("javascript") || type.includes("json")) 
      return <FileCode className="h-6 w-6 text-purple-500" />;
    if (type.includes("audio")) return <FileAudio className="h-6 w-6 text-orange-500" />;
    if (type.includes("video")) return <FileVideo className="h-6 w-6 text-pink-500" />;
    return <FileText className="h-6 w-6 text-gray-500" />;
  };

  // Format shared date
  const formattedSharedDate = sharedAt 
    ? new Date(sharedAt).toLocaleDateString(undefined, { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      })
    : null;

  return (
    <Card className="file-card hover:shadow-md transition-shadow duration-200">
      <CardContent className="p-4">
        <div className="flex items-center">
          {getFileIcon()}
          <div className="ml-3 flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate" title={originalName}>
              {originalName}
            </p>
            {sharedBy && (
              <p className="text-xs text-gray-500">
                Shared by: {sharedBy}
              </p>
            )}
          </div>
        </div>
        
        <div className="mt-4 flex justify-between items-center">
          <div className="text-xs text-gray-500">
            {sharedAt ? `Shared: ${formattedSharedDate}` : `Hash: ${hash.substring(0, 6)}...`}
          </div>
          {isNew && (
            <Badge variant="secondary" className="bg-blue-100 text-blue-800 hover:bg-blue-100">
              New
            </Badge>
          )}
          {encrypted && !isNew && (
            <Badge variant="secondary" className="bg-green-100 text-green-800 hover:bg-green-100">
              Encrypted
            </Badge>
          )}
        </div>
      </CardContent>
      
      <div className="bg-gray-50 px-4 py-3 flex justify-between items-center">
        <span className="text-xs text-gray-500">{formatFileSize(size)}</span>
        <div className="flex space-x-2 file-actions">
          <TooltipProvider>
            {onView && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-7 w-7 text-blue-600 hover:text-blue-800"
                    onClick={onView}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>View</p>
                </TooltipContent>
              </Tooltip>
            )}
            
            {onDownload && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-7 w-7 text-gray-600 hover:text-gray-800"
                    onClick={onDownload}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Download</p>
                </TooltipContent>
              </Tooltip>
            )}
            
            {onShare && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-7 w-7 text-blue-600 hover:text-blue-800"
                    onClick={onShare}
                  >
                    <Share2 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Share</p>
                </TooltipContent>
              </Tooltip>
            )}
            
            {onDelete && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-7 w-7 text-red-600 hover:text-red-800"
                    onClick={onDelete}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Delete</p>
                </TooltipContent>
              </Tooltip>
            )}
          </TooltipProvider>
        </div>
      </div>
    </Card>
  );
}
