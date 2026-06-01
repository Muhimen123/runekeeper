'use client';

import { useState, useEffect, useTransition } from 'react';

interface DriveFolder {
  id: string;
  name: string;
  mimeType: string;
}

export default function Dashboard() {
  const userId = "2deb6920-19b0-4fa9-aa5f-6364b03bce5d"; // Demo static User ID
  const [folders, setFolders] = useState<DriveFolder[]>([]);
  const [loading, setLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

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

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between font-sans antialiased">
      {/* Background Orbs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Container */}
      <main className="max-w-4xl w-full mx-auto p-6 md:p-12 z-10 flex-grow">
        
        {/* Header Section */}
        <header className="mb-10 text-center md:text-left">
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
                onClick={fetchFolders}
                disabled={loading}
                className="px-6 py-3 rounded-xl font-semibold text-indigo-300 bg-slate-800/80 border border-slate-700 hover:bg-slate-800 hover:text-white active:scale-95 transition duration-200"
              >
                Sync Folders
              </button>
            </div>
          </div>

          {/* Dynamic Content Display */}
          <div className="mt-8">
            {error && (
              <div className="flex items-start gap-3 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm">
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
                <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500 mb-4">
                  Folders in Root ({folders.length})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {folders.map((folder) => (
                    <div
                      key={folder.id}
                      className="group p-4 bg-slate-900 border border-slate-800 rounded-2xl flex items-center gap-4 hover:border-indigo-500/40 hover:bg-indigo-950/20 hover:scale-[1.01] active:scale-[0.99] transition duration-200 cursor-pointer"
                    >
                      <div className="w-10 h-10 rounded-xl bg-indigo-500/10 group-hover:bg-indigo-500/20 text-indigo-400 flex items-center justify-center transition duration-200">
                        {/* Folder Icon */}
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                        </svg>
                      </div>
                      <div className="overflow-hidden">
                        <p className="font-semibold text-slate-200 group-hover:text-white truncate transition duration-150">
                          {folder.name}
                        </p>
                        <p className="text-xs text-slate-500 font-medium">Google Drive Folder</p>
                      </div>
                    </div>
                  ))}
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
      </main>

      {/* Modern Footer */}
      <footer className="w-full text-center py-6 border-t border-slate-900 bg-slate-950 text-xs text-slate-600">
        &copy; {new Date().getFullYear()} Resource Aggregator. Fully secured with Google Drive API v3.
      </footer>
    </div>
  );
}