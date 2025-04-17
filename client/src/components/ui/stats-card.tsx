import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { 
  Server, 
  FileText, 
  ShieldCheck 
} from "lucide-react";

interface StatsCardProps {
  type: "storage" | "files" | "security";
  title: string;
  value: string;
  icon?: React.ReactNode;
  progress?: number;
  progressText?: string;
  subText1?: string;
  subText2?: string;
  statusText?: string;
}

export function StatsCard({
  type,
  title,
  value,
  icon,
  progress,
  progressText,
  subText1,
  subText2,
  statusText
}: StatsCardProps) {
  // Default icons if not provided
  const defaultIcon = () => {
    switch (type) {
      case "storage":
        return <Server className="h-6 w-6 text-blue-600" />;
      case "files":
        return <FileText className="h-6 w-6 text-emerald-600" />;
      case "security":
        return <ShieldCheck className="h-6 w-6 text-indigo-600" />;
      default:
        return <Server className="h-6 w-6 text-blue-600" />;
    }
  };

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className="p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-gray-100 rounded-md p-3">
              {icon || defaultIcon()}
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
                <dd>
                  <div className="text-lg font-medium text-gray-900">{value}</div>
                </dd>
              </dl>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-50 px-5 py-3">
          <div className="text-sm">
            {progress !== undefined && (
              <>
                <Progress value={progress} className="h-2.5 bg-gray-200" />
                <p className="text-gray-500 mt-2">{progressText}</p>
              </>
            )}
            
            {(subText1 || subText2) && (
              <div className="flex justify-between">
                {subText1 && <span className="text-gray-500">{subText1}</span>}
                {subText2 && <span className="text-gray-500">{subText2}</span>}
              </div>
            )}
            
            {statusText && (
              <div className="flex items-center">
                <div className="h-2 w-2 rounded-full bg-green-400 mr-1"></div>
                <span className="text-gray-500">{statusText}</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
