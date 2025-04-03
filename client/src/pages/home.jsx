import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Navbar } from '../components/layout/navbar.jsx';
import { Footer } from '../components/layout/footer.jsx';
import { FileUpload } from '../components/ui/file-upload.jsx';
import { FileCard } from '../components/ui/file-card.jsx';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { queryClient } from '../lib/queryClient';

export default function Home() {
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  // Check authentication
  const { data: user, isLoading: isUserLoading, isError: isUserError } = useQuery({
    queryKey: ['/api/me'],
    enabled: !!localStorage.getItem('token'),
  });

  // Redirect to login if not authenticated
  React.useEffect(() => {
    if (!isUserLoading && (isUserError || !user)) {
      setLocation('/login');
    }
  }, [isUserLoading, isUserError, user, setLocation]);

  // Fetch files
  const { 
    data: files, 
    isLoading: isFilesLoading, 
    isError: isFilesError 
  } = useQuery({
    queryKey: ['/api/files'],
    enabled: !!user,
  });

  const refreshFiles = () => {
    queryClient.invalidateQueries({ queryKey: ['/api/files'] });
    setRefreshKey(prev => prev + 1);
  };

  const handleDeleteFile = (id) => {
    refreshFiles();
  };

  // Filter files by search term
  const filteredFiles = files?.filter(file => 
    file.originalName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isUserLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!user) {
    return null; // Will redirect to login
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-grow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header Section */}
          <div className="md:flex md:items-center md:justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold text-secondary">Secure File Management</h1>
              <p className="mt-1 text-sm text-slate-500">Files are encrypted using AES-256 algorithm</p>
            </div>
            
            <div className="mt-4 md:mt-0 flex items-center px-4 py-2 bg-green-50 border border-green-200 rounded-md">
              <span className="material-icons text-accent mr-2">security</span>
              <span className="text-sm font-medium text-green-800">End-to-End Encryption Active</span>
            </div>
          </div>
          
          {/* Main Dashboard */}
          <div className="grid md:grid-cols-12 gap-8">
            {/* Upload Panel */}
            <div className="md:col-span-5 lg:col-span-4">
              <FileUpload onFileUploaded={refreshFiles} key={refreshKey} />
            </div>
            
            {/* File Manager */}
            <div className="md:col-span-7 lg:col-span-8">
              <Card className="bg-white rounded-xl shadow-sm border border-slate-200">
                <CardContent className="p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
                    <h2 className="text-lg font-semibold flex items-center">
                      <span className="material-icons text-primary mr-2">folder</span>
                      Your Files
                    </h2>
                    
                    {/* Search and Filter */}
                    <div className="mt-3 sm:mt-0 flex space-x-2">
                      <div className="relative">
                        <Input
                          type="text"
                          placeholder="Search files"
                          className="pl-8 pr-4 py-2 text-sm"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <span className="material-icons text-slate-400 absolute left-2 top-2 text-sm">search</span>
                      </div>
                      
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="bg-slate-100 p-2 rounded-md hover:bg-slate-200" 
                        title="Refresh"
                        onClick={refreshFiles}
                      >
                        <span className="material-icons text-slate-600 text-sm">refresh</span>
                      </Button>
                    </div>
                  </div>
                  
                  {/* File List */}
                  <div className="overflow-hidden">
                    {/* Table Header */}
                    <div className="hidden md:grid md:grid-cols-12 text-xs font-medium text-slate-500 uppercase tracking-wider py-3 px-4 bg-slate-50 rounded-t-lg">
                      <div className="md:col-span-5">File Name</div>
                      <div className="md:col-span-2">Size</div>
                      <div className="md:col-span-3">Date</div>
                      <div className="md:col-span-2 text-right">Actions</div>
                    </div>
                    
                    {/* File Items */}
                    <div className="divide-y divide-slate-200">
                      {isFilesLoading ? (
                        <div className="py-4 text-center">Loading files...</div>
                      ) : isFilesError ? (
                        <div className="py-4 text-center text-red-500">
                          Error loading files. Please try again.
                        </div>
                      ) : filteredFiles && filteredFiles.length > 0 ? (
                        filteredFiles.map((file) => (
                          <FileCard
                            key={file.id}
                            id={file.id}
                            fileName={file.originalName}
                            fileSize={file.fileSize}
                            fileType={file.fileType}
                            uploadDate={new Date(file.createdAt)}
                            isEncrypted={file.isEncrypted}
                            onDelete={handleDeleteFile}
                            onRefresh={refreshFiles}
                          />
                        ))
                      ) : (
                        <div className="py-8 text-center">
                          <span className="material-icons text-slate-400 text-4xl mb-2">
                            folder_open
                          </span>
                          <p className="text-slate-500">No files found.</p>
                          <p className="text-sm text-slate-400 mt-1">
                            Upload a file to get started.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Pagination */}
                  {filteredFiles && filteredFiles.length > 0 && (
                    <div className="mt-6 flex items-center justify-between">
                      <p className="text-sm text-slate-500">
                        Showing {filteredFiles.length} {filteredFiles.length === 1 ? 'file' : 'files'}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}