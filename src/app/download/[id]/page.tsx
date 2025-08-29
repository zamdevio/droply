'use client'

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { SkeletonFileInfo } from "@/components/layout/Skeleton";
import { FileInfo } from "@/types/file";
import { 
  LockClosedIcon, 
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  ArrowDownTrayIcon,
  DocumentIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';

export default function Download() {
  const params = useParams();
  const id = params.id as string;
  const [status, setStatus] = useState<"loading" | "info" | "downloading" | "success" | "error">("loading");
  const [fileInfo, setFileInfo] = useState<FileInfo | null>(null);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetchFileInfo();
  }, [id]);

  async function fetchFileInfo() {
    try {
      const res = await fetch(`/api/v1/info/${id}`);
      if (!res.ok) {
        setError("File not found");
        setStatus("error");
        return;
      }
      
      const data = await res.json();
      setFileInfo(data.file);
      setStatus("info"); // Show info first, don't auto-download
    } catch (error) {
      setError("Failed to load file info");
      setStatus("error");
    }
  }

  async function startDownload() {
    if (!fileInfo) return;
    
    setIsDownloading(true);
    setStatus("downloading");
    
    try {
      const response = await fetch(`/api/v1/download/${id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          password: password || 'dummy' // Send dummy password for public files
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Download failed');
      }

      // For demo, just show success message
      // In real app, you'd handle the actual file download
      setStatus("success");
      
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Download failed');
      setStatus("error");
    } finally {
      setIsDownloading(false);
    }
  }

  function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.trim()) {
      startDownload();
    }
  }

  if (status === "loading") {
    return <SkeletonFileInfo />;
  }

  if (status === "error") {
    return (
      <div className="min-h-[60vh] grid place-items-center">
        <div className="text-center">
          <div className="w-24 h-24 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <ExclamationTriangleIcon className="w-12 h-12 text-red-600 dark:text-red-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Download Failed</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          <a href="/" className="text-blue-600 dark:text-blue-400 hover:underline">← Back to Upload</a>
        </div>
      </div>
    );
  }

  if (status === "info" && fileInfo) {
    return (
      <div className="max-w-2xl mx-auto py-8">
        {/* File Info Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-8 mb-8">
          <div className="flex items-start gap-4 mb-6">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-xl flex items-center justify-center flex-shrink-0">
              <DocumentIcon className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {fileInfo.name}
              </h1>
              <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mb-2">
                <span>{fileInfo.size} bytes</span>
                <span>•</span>
                <span>{fileInfo.type}</span>
                <span>•</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  fileInfo.visibility === 'public' 
                    ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                    : 'bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300'
                }`}>
                  {fileInfo.visibility === 'public' ? 'Public' : 'Private'}
                </span>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Uploaded on {new Date(fileInfo.createdAt).toLocaleDateString()}
              </p>
              {fileInfo.expiresAt && (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Expires on {new Date(fileInfo.expiresAt).toLocaleDateString()}
                </p>
              )}
              {fileInfo.maxDownloads && (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Downloads: {fileInfo.downloadCount}/{fileInfo.maxDownloads}
                </p>
              )}
            </div>
          </div>

          {/* Password Form for Private Files */}
          {fileInfo.visibility === 'private' && (
            <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Password Required
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter file password"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              </form>
            </div>
          )}

          {/* Download Button */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={startDownload}
              disabled={isDownloading || (fileInfo.visibility === 'private' && !password.trim())}
              size="lg"
              className="flex-1"
            >
              {isDownloading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Authorizing...
                </>
              ) : (
                <>
                  <ArrowDownTrayIcon className="w-5 h-5 mr-2" />
                  Download File
                </>
              )}
            </Button>
            
            <Button
              variant="outline"
              onClick={() => window.history.back()}
              size="lg"
            >
              Go Back
            </Button>
          </div>
        </div>

        {/* Security Notice */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <ShieldCheckIcon className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
            <div className="text-sm text-blue-800 dark:text-blue-200">
              <p className="font-medium mb-1">🔒 Secure Download</p>
              <p>
                {fileInfo.visibility === 'public' 
                  ? 'This file is public and can be downloaded by anyone.'
                  : 'This file is private and requires a password for access.'
                }
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (status === "downloading") {
    return (
      <div className="min-h-[60vh] grid place-items-center">
        <div className="text-center">
          <div className="w-24 h-24 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
            <ClockIcon className="w-12 h-12 text-blue-600 dark:text-blue-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Starting Download...</h1>
          <p className="text-gray-600 dark:text-gray-400">Your file should begin downloading shortly.</p>
        </div>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="min-h-[60vh] grid place-items-center">
        <div className="text-center">
          <div className="w-24 h-24 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircleIcon className="w-12 h-12 text-green-600 dark:text-green-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Download Complete!</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-4">Your file has been downloaded successfully.</p>
          <a href="/" className="text-blue-600 dark:text-blue-400 hover:underline">← Back to Upload</a>
        </div>
      </div>
    );
  }

  return null;
}
