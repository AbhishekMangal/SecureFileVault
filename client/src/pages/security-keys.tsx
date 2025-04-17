import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, Copy, Key, Shield, Lock, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function SecurityKeys() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("public-key");
  
  // Fetch security keys
  const { data: keys, isLoading, error } = useQuery({
    queryKey: ['/api/security-keys'],
  });
  
  // Format PEM key for display
  const formatKeyForDisplay = (pemKey: string | undefined) => {
    if (!pemKey) return "";
    
    // Split the key into lines and limit to a reasonable number for display
    const lines = pemKey.split('\n');
    const limitedLines = lines.length > 12 ? [...lines.slice(0, 10), '...', lines[lines.length - 1]] : lines;
    
    return limitedLines.join('\n');
  };
  
  // Copy key to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(
      () => {
        toast({
          title: "Copied to clipboard",
          description: "The key has been copied to your clipboard.",
        });
      },
      (err) => {
        console.error('Failed to copy: ', err);
        toast({
          title: "Failed to copy",
          description: "Could not copy to clipboard. Please try again.",
          variant: "destructive",
        });
      }
    );
  };

  return (
    <DashboardLayout>
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            There was an error loading your security keys. Please try again.
          </AlertDescription>
        </Alert>
      )}
      
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center">
              <Shield className="h-6 w-6 text-blue-600 mr-2" />
              <CardTitle>Security Keys</CardTitle>
            </div>
            <CardDescription>
              Your cryptographic keys are used to ensure the security of your files
            </CardDescription>
          </CardHeader>
          
          <Tabs defaultValue="public-key" value={activeTab} onValueChange={setActiveTab}>
            <div className="px-6">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="public-key">Public Key</TabsTrigger>
                <TabsTrigger value="key-info">Key Information</TabsTrigger>
              </TabsList>
            </div>
            
            <TabsContent value="public-key" className="p-6 pt-2">
              {isLoading ? (
                <div className="text-center py-8 text-gray-500">Loading your keys...</div>
              ) : (
                <>
                  <Alert className="mb-4">
                    <Info className="h-4 w-4" />
                    <AlertTitle>Your Public Key</AlertTitle>
                    <AlertDescription>
                      This key can be shared with others to encrypt messages intended for you.
                    </AlertDescription>
                  </Alert>
                  
                  <div className="bg-gray-50 p-4 rounded-md font-mono text-xs overflow-x-auto whitespace-pre">
                    {formatKeyForDisplay(keys?.publicKey)}
                  </div>
                  
                  <div className="mt-4 flex justify-end">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => copyToClipboard(keys?.publicKey || "")}
                      disabled={isLoading || !keys?.publicKey}
                    >
                      <Copy className="mr-2 h-4 w-4" />
                      Copy Public Key
                    </Button>
                  </div>
                </>
              )}
            </TabsContent>
            
            <TabsContent value="key-info" className="p-6 pt-2">
              <div className="space-y-4">
                <Alert>
                  <Lock className="h-4 w-4" />
                  <AlertTitle>Key Security</AlertTitle>
                  <AlertDescription>
                    Your private key is securely stored and never exposed to others.
                  </AlertDescription>
                </Alert>
                
                <div className="grid gap-4 md:grid-cols-2">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Key Type</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold">RSA</p>
                      <p className="text-sm text-gray-500">Public/Private Key Pair</p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Key Strength</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold">2048-bit</p>
                      <p className="text-sm text-gray-500">Industry Standard Security</p>
                    </CardContent>
                  </Card>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-md">
                  <h4 className="font-medium mb-2 flex items-center">
                    <Key className="h-4 w-4 mr-2" />
                    Key Usage Information
                  </h4>
                  <ul className="space-y-1 text-sm text-gray-600">
                    <li>• Your public key is used to verify your identity and encrypt files for sharing.</li>
                    <li>• Your private key is used to decrypt files that have been shared with you.</li>
                    <li>• Keys are automatically generated when you create your account.</li>
                    <li>• All encryption and decryption happens in your browser for maximum security.</li>
                  </ul>
                </div>
              </div>
            </TabsContent>
          </Tabs>
          
          <CardFooter className="bg-gray-50 px-6 py-4">
            <div className="text-xs text-gray-500">
              Your keys were generated securely when you created your account and are protected with advanced encryption.
            </div>
          </CardFooter>
        </Card>
        
        <Card>
          <CardHeader>
            <div className="flex items-center">
              <Lock className="h-6 w-6 text-emerald-600 mr-2" />
              <CardTitle>Encryption Information</CardTitle>
            </div>
            <CardDescription>
              Learn about the encryption methods used to secure your files
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="bg-gray-50 p-4 rounded-md text-center">
                  <h3 className="text-xl font-bold text-blue-600">AES-256</h3>
                  <p className="text-sm text-gray-600 mt-1">File Encryption</p>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-md text-center">
                  <h3 className="text-xl font-bold text-emerald-600">SHA-256</h3>
                  <p className="text-sm text-gray-600 mt-1">File Integrity</p>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-md text-center">
                  <h3 className="text-xl font-bold text-indigo-600">RSA-2048</h3>
                  <p className="text-sm text-gray-600 mt-1">Key Security</p>
                </div>
              </div>
              
              <div className="prose max-w-none">
                <p>
                  SecureTransfer uses military-grade encryption to protect your files during transmission and storage.
                  Your files are encrypted end-to-end, meaning they are encrypted before leaving your browser
                  and can only be decrypted by the intended recipient.
                </p>
                
                <h4 className="text-base font-medium mt-4">Our Security Process:</h4>
                <ol className="mt-2 pl-5 list-decimal">
                  <li>Files are encrypted in your browser using AES-256.</li>
                  <li>A unique SHA-256 hash is generated to ensure file integrity.</li>
                  <li>Files are transmitted over a secure TLS connection.</li>
                  <li>For sharing, recipient's RSA public key is used to encrypt the file key.</li>
                  <li>Only the recipient's private key can decrypt the shared file.</li>
                </ol>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
