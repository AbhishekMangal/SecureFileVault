import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { Share2, Search } from "lucide-react";
import { useQuery, useMutation, QueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface ShareFileModalProps {
  isOpen: boolean;
  onClose: () => void;
  fileId: number | null;
  fileName: string | null;
  onShareComplete?: () => void;
}

interface User {
  id: number;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
}

export function ShareFileModal({
  isOpen,
  onClose,
  fileId,
  fileName,
  onShareComplete
}: ShareFileModalProps) {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [permissionLevel, setPermissionLevel] = useState<string>("view");
  const [note, setNote] = useState("");
  
  // Fetch users
  const { data: users, isLoading } = useQuery<User[]>({
    queryKey: ['/api/users'],
    enabled: isOpen,
  });
  
  // Share file mutation
  const shareMutation = useMutation({
    mutationFn: async () => {
      if (!fileId) throw new Error("File ID is required");
      
      return apiRequest('POST', `/api/files/${fileId}/share`, {
        sharedWithUserIds: selectedUsers,
        permissionLevel,
        note: note.trim() || undefined
      });
    },
    onSuccess: async () => {
      toast({
        title: "File shared successfully",
        description: `${fileName} has been shared with ${selectedUsers.length} user${selectedUsers.length !== 1 ? 's' : ''}`,
      });
      
      // Reset the form
      setSelectedUsers([]);
      setPermissionLevel("view");
      setNote("");
      setSearchTerm("");
      
      if (onShareComplete) {
        onShareComplete();
      }
      
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Error sharing file",
        description: error instanceof Error ? error.message : "Failed to share the file",
        variant: "destructive",
      });
    }
  });
  
  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedUsers([]);
      setPermissionLevel("view");
      setNote("");
      setSearchTerm("");
    }
  }, [isOpen]);
  
  // Filter users based on search term
  const filteredUsers = users?.filter(user => {
    const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
    const searchLower = searchTerm.toLowerCase();
    
    return (
      user.username.toLowerCase().includes(searchLower) ||
      user.email.toLowerCase().includes(searchLower) ||
      fullName.toLowerCase().includes(searchLower)
    );
  });
  
  // Toggle user selection
  const toggleUserSelection = (userId: number) => {
    setSelectedUsers(prev => 
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };
  
  // Get user initials
  const getUserInitials = (user: User) => {
    if (user.firstName && user.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`;
    }
    return user.username.substring(0, 2).toUpperCase();
  };
  
  // Handle share button click
  const handleShare = () => {
    if (selectedUsers.length === 0) {
      toast({
        title: "No users selected",
        description: "Please select at least one user to share with",
        variant: "destructive",
      });
      return;
    }
    
    shareMutation.mutate();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center">
            <div className="bg-blue-100 p-2 rounded-full mr-3">
              <Share2 className="h-5 w-5 text-blue-600" />
            </div>
            <DialogTitle>Share File</DialogTitle>
          </div>
          <DialogDescription>
            {fileName ? (
              <>Share <span className="font-semibold">{fileName}</span> with other users</>
            ) : (
              <>Share this file with other users</>
            )}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="user-search">Find users to share with</Label>
            <div className="relative">
              <Input
                id="user-search"
                placeholder="Search by name or email"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
              <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>Select users</Label>
            <ScrollArea className="h-48 border rounded-md">
              {isLoading ? (
                <div className="p-4 text-center text-gray-500">Loading users...</div>
              ) : filteredUsers?.length === 0 ? (
                <div className="p-4 text-center text-gray-500">No users found</div>
              ) : (
                <div className="divide-y">
                  {filteredUsers?.map(user => (
                    <div
                      key={user.id}
                      className="p-3 hover:bg-gray-50 flex items-center justify-between cursor-pointer"
                      onClick={() => toggleUserSelection(user.id)}
                    >
                      <div className="flex items-center">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>{getUserInitials(user)}</AvatarFallback>
                          <AvatarImage src={`https://www.gravatar.com/avatar/${btoa(user.email)}?d=mp`} />
                        </Avatar>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-900">
                            {user.firstName && user.lastName
                              ? `${user.firstName} ${user.lastName}`
                              : user.username}
                          </p>
                          <p className="text-xs text-gray-500">{user.email}</p>
                        </div>
                      </div>
                      <Checkbox 
                        checked={selectedUsers.includes(user.id)}
                        onCheckedChange={() => toggleUserSelection(user.id)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
            {selectedUsers.length > 0 && (
              <p className="text-xs text-gray-500">
                {selectedUsers.length} user{selectedUsers.length !== 1 ? 's' : ''} selected
              </p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="permission-select">Permission level</Label>
            <Select value={permissionLevel} onValueChange={setPermissionLevel}>
              <SelectTrigger id="permission-select">
                <SelectValue placeholder="Select permission level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="view">View only</SelectItem>
                <SelectItem value="download">Download</SelectItem>
                <SelectItem value="full">Full access</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="share-note">Add a note (optional)</Label>
            <Textarea
              id="share-note"
              placeholder="Add a message to recipients..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="resize-none"
              rows={2}
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={shareMutation.isPending}>
            Cancel
          </Button>
          <Button 
            onClick={handleShare}
            disabled={selectedUsers.length === 0 || shareMutation.isPending}
          >
            {shareMutation.isPending ? "Sharing..." : "Share"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
