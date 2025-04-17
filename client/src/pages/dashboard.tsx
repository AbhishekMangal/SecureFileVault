import React from "react";
import { useQuery } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { StatsCard } from "@/components/ui/stats-card";
import { FileTable } from "@/components/ui/file-table";
import { FileUploader } from "@/components/file-uploader";
import { useFiles } from "@/context/file-context";
import { useAuth } from "@/context/auth-context";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function Dashboard() {
  const { user } = useAuth();
  const { viewEncryptedFile, shareFile, downloadFile, deleteFile } = useFiles();
  
  // Fetch user stats
  const { data: stats, isLoading: statsLoading, error: statsError } = useQuery({
    queryKey: ['/api/users/stats'],
    enabled: !!user,
  });
  
  // Fetch recent files
  const { data: files, isLoading: filesLoading, error: filesError } = useQuery({
    queryKey: ['/api/files'],
    enabled: !!user,
  });
  
  // Calculate storage percentage
  const storagePercentage = stats 
    ? parseFloat(stats.totalSizeMB) / 1024 * 100 // Assuming 10GB max storage
    : 0;
  
  // Limit recent files to 5 for dashboard
  const recentFiles = files ? [...files].sort((a, b) => 
    new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
  ).slice(0, 5) : [];

  return (
    <DashboardLayout subtitle={user ? `Welcome back, ${user.firstName || user.username}` : "Welcome back"}>
      {(statsError || filesError) && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            There was an error loading the dashboard. Please try again.
          </AlertDescription>
        </Alert>
      )}
      
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Storage Stats Card */}
        <StatsCard
          type="storage"
          title="Storage Used"
          value={stats ? `${stats.totalSizeMB} MB / 10 GB` : "Loading..."}
          progress={storagePercentage}
          progressText={`${Math.round(storagePercentage)}% of your storage used`}
          isLoading={statsLoading}
        />

        {/* Files Stats Card */}
        <StatsCard
          type="files"
          title="Files"
          value={stats ? `${stats.totalFiles} Files` : "Loading..."}
          subText1={stats ? `Encrypted: ${stats.encryptedFiles}` : ""}
          subText2={stats ? `Shared: ${stats.sharedByMe}` : ""}
          isLoading={statsLoading}
        />

        {/* Security Stats Card */}
        <StatsCard
          type="security"
          title="Security Status"
          value="Protected"
          statusText="Keys are up to date"
          isLoading={statsLoading}
        />
      </div>

      {/* Upload Section */}
      <div className="mt-6">
        <FileUploader />
      </div>

      {/* Recent Files */}
      <div className="mt-6">
        <FileTable 
          files={recentFiles}
          type="standard"
          showActions={true}
          isLoading={filesLoading}
          onView={(file) => viewEncryptedFile(file.id)}
          onDownload={(file) => downloadFile(file.id)}
          onShare={(file) => shareFile(file.id, file.originalName)}
          onDelete={(file) => deleteFile(file.id)}
        />
      </div>
    </DashboardLayout>
  );
}
