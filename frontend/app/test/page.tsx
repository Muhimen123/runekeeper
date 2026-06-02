'use client';

import { useState, useEffect, useTransition } from 'react';

interface DriveFolder {
  id: string;
  name: string;
  mimeType: string;
}

interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  webViewLink?: string;
  size?: number;
}

interface UploadedFile {
  id: string;
  name: string;
  mimeType: string;
  webViewLink?: string;
  webContentLink?: string;
}

export default function Dashboard() {
  const userId = "2deb6920-19b0-4fa9-aa5f-6364b03bce5d"; // Demo static User ID
  const [folders, setFolders] = useState<DriveFolder[]>([]);
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [filesLoading, setFilesLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Upload & Folder state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);

  // Check URL parameters for successful connection redirect
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('status') === 'success') {
        setIsConnected(true);
        // Automatically fetch folders when connected successfully
        fetchFolders();
      }
    }
  }, []);

  // Automatically fetch folders and files on mount/connection
  useEffect(() => {
    if (isConnected) {
      fetchFiles(selectedFolderId);
    }
  }, [selectedFolderId, isConnected]);

  const handleConnect = () => {
    startTransition(() => {
      // Redirect to Spring Boot backend to trigger the Google OAuth flow
      window.location.href = `http://localhost:8080/api/v1/oauth/connect?userId=${userId}`;
    });
  };

  const fetchFolders = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`http://localhost:8080/api/v1/drive/folders?userId=${userId}`);
      if (res.ok) {
        const data = await res.json();
        setFolders(data || []);
        setIsConnected(true);
      } else {
        if (res.status === 500) {
          setError("Google Drive is not connected yet, or access has expired.");
          setIsConnected(false);
        } else {
          setError("Failed to fetch folders. Please verify your connection.");
        }
      }
    } catch (err) {
      console.error(err);
      setError("Unable to connect to the backend server.");
    } finally {
      setLoading(false);
    }
  };

  const fetchFiles = async (folderId: string | null) => {
    setFilesLoading(true);
    try {
      const url = `http://localhost:8080/api/v1/drive/files?userId=${userId}${folderId ? `&folderId=${folderId}` : ''}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setFiles(data || []);
      } else {
        console.error("Failed to fetch files");
      }
    } catch (err) {
      console.error("Unable to connect to fetch files:", err);
    } finally {
      setFilesLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
      setUploadedFile(null);
      setError(null);
    }
  };

  const handleFolderSelect = (folderId: string) => {
    setSelectedFolderId(prev => prev === folderId ? null : folderId);
    setUploadedFile(null);
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    setUploading(true);
    setError(null);
    setUploadedFile(null);

    const formData = new FormData();
    formData.append("userId", userId);
    formData.append("file", selectedFile);
    if (selectedFolderId) {
      formData.append("folderId", selectedFolderId);
    }

    try {
      const res = await fetch("http://localhost:8080/api/v1/drive/upload", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        setUploadedFile(data);
        setSelectedFile(null);
        // Refresh file list for the current active directory
        fetchFiles(selectedFolderId);
        // Reset file input
        const fileInput = document.getElementById("file-input") as HTMLInputElement;
        if (fileInput) fileInput.value = "";
      } else {
        const errText = await res.text();
        setError(`Failed to upload file: ${errText || res.statusText}`);
      }
    } catch (err) {
      console.error(err);
      setError("Unable to upload file to the server.");
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteFile = async (fileId: string) => {
    if (!confirm("Are you sure you want to delete this file from Google Drive?")) return;

    setError(null);
    try {
      const res = await fetch(`http://localhost:8080/api/v1/drive/files/${fileId}?userId=${userId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setFiles(prev => prev.filter(file => file.id !== fileId));
      } else {
        const errText = await res.text();
        setError(`Failed to delete file: ${errText || res.statusText}`);
      }
    } catch (err) {
      console.error(err);
      setError("Unable to delete file from the server.");
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (bytes === undefined || bytes === null) return 'Unknown size';
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getSelectedFolderName = () => {
    const folder = folders.find(f => f.id === selectedFolderId);
    return folder ? folder.name : null;
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.includes('image')) return '🖼️';
    if (mimeType.includes('pdf')) return '📄';
    if (mimeType.includes('video') || mimeType.includes('audio')) return '🎬';
    if (mimeType.includes('text') || mimeType.includes('document')) return '📝';
    return '📎';
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between font-sans antialiased relative">
      {/* Background Orbs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Container */}
      <main className="max-w-4xl w-full mx-auto p-6 md:p-12 z-10 flex-grow space-y-8">
        
        {/* Header Section */}
        <header className="text-center md:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold tracking-wide uppercase mb-4">
            Cloud Integrations
          </div>
          <h1 className="text-4xl md:text-5xl font-black bg-gradient-to-r from-white via-indigo-200 to-violet-400 bg-clip-text text-transparent tracking-tight">
            Resource Aggregator
          </h1>
          <p className="text-slate-400 mt-2 text-lg">
            Manage, discover, and organize all your external cloud assets in one unified workspace.
          </p>
        </header>

        {/* Integration Hub Card */}
        <section className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-xl pointer-events-none" />
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-slate-800">
            {/* Service Brand */}
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                {/* Google Drive custom icon SVG */}
                <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-bold tracking-tight">Google Drive</h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`inline-block w-2.5 h-2.5 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-slate-600'}`} />
                  <span className="text-sm font-medium text-slate-400">
                    {isConnected ? 'Connected' : 'Not Connected'}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleConnect}
                disabled={isPending}
                className="relative px-6 py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 active:scale-95 transition duration-200 shadow-md shadow-indigo-600/20 disabled:opacity-50"
              >
                {isPending ? 'Connecting...' : 'Connect Drive'}
              </button>

              <button
                onClick={() => {
                  fetchFolders();
                  fetchFiles(selectedFolderId);
                }}
                disabled={loading || filesLoading}
                className="px-6 py-3 rounded-xl font-semibold text-indigo-300 bg-slate-800/80 border border-slate-700 hover:bg-slate-800 hover:text-white active:scale-95 transition duration-200"
              >
                Sync Directory
              </button>
            </div>
          </div>

          {/* Dynamic Content Display */}
          <div className="mt-8">
            {error && (
              <div className="flex items-start gap-3 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm mb-6">
                <svg className="w-5 h-5 flex-shrink-0 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            {loading ? (
              <div className="flex flex-col items-center justify-center py-16 space-y-4">
                <div className="w-10 h-10 border-4 border-indigo-500/30 border-t-indigo-400 rounded-full animate-spin" />
                <p className="text-slate-400 text-sm font-medium animate-pulse">Retrieving your Drive structure...</p>
              </div>
            ) : folders.length > 0 ? (
              <div>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-4">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
                    Folders in Root ({folders.length})
                  </h3>
                  <p className="text-xs text-indigo-400 font-medium animate-pulse">
                    💡 Click a folder below to navigate and upload inside it!
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {folders.map((folder) => {
                    const isSelected = selectedFolderId === folder.id;
                    return (
                      <div
                        key={folder.id}
                        onClick={() => handleFolderSelect(folder.id)}
                        className={`group p-4 rounded-2xl flex items-center justify-between border transition duration-200 cursor-pointer ${
                          isSelected
                            ? 'bg-indigo-950/30 border-indigo-500 shadow-lg shadow-indigo-500/5 scale-[1.01]'
                            : 'bg-slate-900 border-slate-800 hover:border-indigo-500/40 hover:bg-indigo-950/10 hover:scale-[1.01] active:scale-[0.99]'
                        }`}
                      >
                        <div className="flex items-center gap-4 overflow-hidden">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition duration-200 ${
                            isSelected ? 'bg-indigo-500/25 text-indigo-300' : 'bg-indigo-500/10 group-hover:bg-indigo-500/20 text-indigo-400'
                          }`}>
                            {/* Folder Icon */}
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                            </svg>
                          </div>
                          <div className="overflow-hidden">
                            <p className={`font-semibold truncate transition duration-150 ${
                              isSelected ? 'text-indigo-200' : 'text-slate-200 group-hover:text-white'
                            }`}>
                              {folder.name}
                            </p>
                            <p className="text-xs text-slate-500 font-medium">Google Drive Folder</p>
                          </div>
                        </div>

                        {isSelected && (
                          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-[10px] font-bold tracking-wider uppercase border border-indigo-500/30">
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-ping" />
                            Active Folder
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              !loading && !error && (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="w-16 h-16 rounded-full bg-slate-800/50 flex items-center justify-center text-slate-600 mb-4">
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                    </svg>
                  </div>
                  <h4 className="text-lg font-bold text-slate-300">No folders retrieved</h4>
                  <p className="text-sm text-slate-500 mt-1 max-w-sm">
                    {isConnected 
                      ? "Your drive is empty or does not contain root folders." 
                      : "Connect your Google Drive account above to synchronize your directories."}
                  </p>
                </div>
              )
            )}
          </div>
        </section>

        {/* Upload Assets Section */}
        {isConnected && (
          <section className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="absolute top-0 right-0 w-32 h-32 bg-violet-500/5 rounded-full blur-xl pointer-events-none" />
            
            <div className="mb-6">
              <h2 className="text-2xl font-bold tracking-tight">Upload Assets</h2>
              <p className="text-slate-400 text-sm mt-1">
                Upload files securely. Data is directly streamed to your Google Drive workspace.
              </p>
            </div>

            <form onSubmit={handleUpload} className="space-y-6">
              {/* Destination folder display */}
              <div className="flex items-center justify-between p-3.5 bg-slate-950/80 rounded-2xl border border-slate-800 text-sm">
                <span className="text-slate-400 flex items-center gap-2">
                  <span className="inline-block w-2.5 h-2.5 rounded-full bg-indigo-500" />
                  Destination:
                </span>
                <span className="font-semibold text-slate-200 flex items-center gap-2">
                  {selectedFolderId ? (
                    <>
                      <span className="text-indigo-400">📁 {getSelectedFolderName()}</span>
                      <button
                        type="button"
                        onClick={() => setSelectedFolderId(null)}
                        className="text-xs px-2.5 py-0.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
                      >
                        Reset to Root
                      </button>
                    </>
                  ) : (
                    <span className="text-indigo-400">📂 Root Directory</span>
                  )}
                </span>
              </div>

              {/* Drag/Drop Interactive Zone */}
              <div className="relative group">
                <input
                  type="file"
                  id="file-input"
                  onChange={handleFileChange}
                  disabled={uploading}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 disabled:cursor-not-allowed"
                />
                <div className={`border-2 border-dashed rounded-2xl p-8 text-center transition duration-200 ${
                  selectedFile
                    ? 'border-indigo-500/50 bg-indigo-950/10'
                    : 'border-slate-800 bg-slate-950/40 group-hover:border-indigo-500/40 group-hover:bg-indigo-950/5'
                }`}>
                  {selectedFile ? (
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <div className="w-12 h-12 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                        {/* File icon */}
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div className="max-w-xs overflow-hidden">
                        <p className="font-bold text-slate-100 truncate text-sm">{selectedFile.name}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{formatFileSize(selectedFile.size)} &bull; {selectedFile.type || 'Unknown MIME'}</p>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedFile(null);
                          const fileInput = document.getElementById("file-input") as HTMLInputElement;
                          if (fileInput) fileInput.value = "";
                        }}
                        className="text-xs text-rose-400 hover:text-rose-300 font-semibold underline mt-2"
                      >
                        Remove file
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <div className="w-12 h-12 rounded-xl bg-slate-800 text-slate-400 flex items-center justify-center group-hover:scale-110 transition duration-300">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        </svg>
                      </div>
                      <div>
                        <p className="font-semibold text-slate-300 text-sm">Click to select a local asset</p>
                        <p className="text-xs text-slate-500 mt-1">Supports any document, media file, or archive</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Action trigger */}
              <button
                type="submit"
                disabled={!selectedFile || uploading}
                className="w-full relative px-6 py-3.5 rounded-xl font-bold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 active:scale-[0.98] transition duration-200 disabled:opacity-40 disabled:pointer-events-none shadow-lg shadow-indigo-600/10 flex items-center justify-center gap-2"
              >
                {uploading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Streaming to Google Drive...</span>
                  </>
                ) : (
                  <>
                    <span>Upload to {selectedFolderId ? 'Selected Folder' : 'Root Drive'}</span>
                  </>
                )}
              </button>
            </form>

            {/* Success feedback state */}
            {uploadedFile && (
              <div className="mt-6 p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 flex flex-col md:flex-row md:items-center justify-between gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/25 text-emerald-400 flex-shrink-0 flex items-center justify-center">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-100">Upload Complete!</h4>
                    <p className="text-xs text-emerald-400/80 mt-0.5 truncate max-w-sm md:max-w-md">
                      Successfully saved &quot;{uploadedFile.name}&quot; to Google Drive.
                    </p>
                  </div>
                </div>

                {uploadedFile.webViewLink && (
                  <a
                    href={uploadedFile.webViewLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/10 hover:scale-[1.02] active:scale-[0.98] transition duration-200"
                  >
                    <span>Open in Drive</span>
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                )}
              </div>
            )}
          </section>
        )}

        {/* Files Listing & Management Section */}
        {isConnected && (
          <section className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="absolute top-0 left-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-xl pointer-events-none" />
            
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-2xl font-bold tracking-tight">
                  Files in {selectedFolderId ? `📁 ${getSelectedFolderName()}` : '📂 Root Directory'}
                </h2>
                <p className="text-slate-400 text-sm mt-1">
                  Manage external assets. View documents or delete them permanently from your Google Drive.
                </p>
              </div>

              <button
                onClick={() => fetchFiles(selectedFolderId)}
                disabled={filesLoading}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 bg-slate-850 hover:bg-slate-800 hover:text-white border border-slate-700 active:scale-95 transition duration-200"
              >
                Refresh List
              </button>
            </div>

            {/* List Loader / Display */}
            {filesLoading ? (
              <div className="flex flex-col items-center justify-center py-12 space-y-3">
                <div className="w-8 h-8 border-3 border-indigo-500/20 border-t-indigo-400 rounded-full animate-spin" />
                <p className="text-slate-500 text-xs font-medium animate-pulse">Syncing files with Google Drive...</p>
              </div>
            ) : files.length > 0 ? (
              <div className="divide-y divide-slate-800/60 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {files.map((file) => (
                  <div
                    key={file.id}
                    className="group py-4 flex items-center justify-between gap-4 transition duration-150 hover:bg-slate-950/10 -mx-4 px-4 rounded-xl"
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <span className="text-2xl w-9 h-9 rounded-xl bg-slate-950 flex items-center justify-center border border-slate-800">
                        {getFileIcon(file.mimeType)}
                      </span>
                      <div className="overflow-hidden">
                        <p className="font-semibold text-slate-200 group-hover:text-white text-sm truncate max-w-sm md:max-w-md">
                          {file.name}
                        </p>
                        <p className="text-xs text-slate-500 font-medium">
                          {formatFileSize(file.size)} &bull; {file.mimeType.split('/').pop()?.toUpperCase()}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 flex-shrink-0">
                      {file.webViewLink && (
                        <a
                          href={file.webViewLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-8 h-8 rounded-lg bg-slate-800/80 border border-slate-700/50 hover:bg-indigo-500/10 hover:text-indigo-400 flex items-center justify-center transition"
                          title="View on Google Drive"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </a>
                      )}
                      
                      <button
                        onClick={() => handleDeleteFile(file.id)}
                        className="w-8 h-8 rounded-lg bg-slate-800/80 border border-slate-700/50 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 flex items-center justify-center transition"
                        title="Delete File"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <span className="text-3xl text-slate-700">📂</span>
                <h4 className="text-sm font-semibold text-slate-400 mt-2">No files in directory</h4>
                <p className="text-xs text-slate-650 mt-1 max-w-xs">
                  This directory does not contain any assets yet. Select a file above to upload one!
                </p>
              </div>
            )}
          </section>
        )}
      </main>

      {/* Modern Footer */}
      <footer className="w-full text-center py-6 border-t border-slate-900 bg-slate-950 text-xs text-slate-600 z-10">
        &copy; {new Date().getFullYear()} Resource Aggregator. Fully secured with Google Drive API v3.
      </footer>
    </div>
  );
}