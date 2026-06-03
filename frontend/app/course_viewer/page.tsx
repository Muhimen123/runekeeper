"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Sidebar from "../components/Sidebar";
import CourseTopBar from "../components/CourseTopBar";
import "../auth_init/auth.css";
import "../homepage/homepage.css";

interface FolderType {
  id: string;
  name: string;
  mimeType: string;
}

interface FileType {
  id: string;
  name: string;
  mimeType: string;
  webViewLink?: string;
  size?: number;
}

interface CourseViewerContentProps {
  courseId: string;
  userId: string;
  onCourseDetailsFetched?: (name: string, semesterId: string) => void;
}

export function CourseViewerContent({ courseId, userId, onCourseDetailsFetched }: CourseViewerContentProps) {
  // 1. Maintain the tracking ID for the directory we are currently looking at
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  // 2. Explicitly track what the "root" folder ID is for this course session
  const [rootFolderId, setRootFolderId] = useState<string | null>(null);
  const [history, setHistory] = useState<string[]>([]);

  const [folders, setFolders] = useState<FolderType[]>([]);
  const [files, setFiles] = useState<FileType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");

  // Popover / Modal states
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [isFileModalOpen, setIsFileModalOpen] = useState(false);

  // Form input states
  const [newFolderName, setNewFolderName] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);

  // ==========================================
  // PHASE A: Resolve Course Root Folder ID
  // ==========================================
  useEffect(() => {
    const resolveCourseRoot = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`http://localhost:8080/api/v1/courses/${courseId}`);
        if (!res.ok) {
          throw new Error(`Failed to resolve course configuration. Status: ${res.status}`);
        }
        const courseData = await res.json();
        
        if (courseData && courseData.rootFolderId) {
          setRootFolderId(courseData.rootFolderId);
          setCurrentFolderId(courseData.rootFolderId);
          setHistory([]);
          if (onCourseDetailsFetched) {
            onCourseDetailsFetched(courseData.name, courseData.semesterId);
          }
        } else {
          throw new Error("This course does not have a root folder mapped in the database archives.");
        }
      } catch (err: any) {
        console.error(err);
        setError(err.message || "Failed to locate course metadata root.");
        setLoading(false);
      }
    };

    if (courseId) {
      resolveCourseRoot();
    }
  }, [courseId]);

  // ==========================================
  // PHASE B: Fetch Items inside currentFolderId
  // ==========================================
  const fetchFoldersAndFiles = async () => {
    if (!currentFolderId) return;
    setLoading(true);
    setError(null);
    try {
      const [foldersRes, filesRes] = await Promise.all([
        fetch(`http://localhost:8080/api/v1/directory/folders?userId=${userId}&parentFolderId=${currentFolderId}`),
        fetch(`http://localhost:8080/api/v1/directory/resources?userId=${userId}&folderId=${currentFolderId}`),
      ]);

      if (foldersRes.ok) {
        const foldersData = await foldersRes.json();
        setFolders(foldersData || []);
      }
      if (filesRes.ok) {
        const filesData = await filesRes.json();
        setFiles(filesData || []);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to load directory items.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentFolderId && userId) {
      fetchFoldersAndFiles();
    }
  }, [currentFolderId, userId]);

  const handleFolderClick = (folderId: string) => {
    if (!currentFolderId) return;
    setHistory((prev) => [...prev, currentFolderId]);
    setCurrentFolderId(folderId);
  };

  const handleGoBack = () => {
    setHistory((prev) => {
      const copy = [...prev];
      const previous = copy.pop();
      setCurrentFolderId(previous || rootFolderId);
      return copy;
    });
  };

  const handleAddFolder = async () => {
    if (!newFolderName.trim()) return;
    setProcessing(true);
    try {
      const res = await fetch(
        `http://localhost:8080/api/v1/directory/folders?userId=${userId}&folderName=${encodeURIComponent(
          newFolderName.trim()
        )}&parentFolderId=${currentFolderId}`,
        {
          method: "POST",
        }
      );
      if (res.ok) {
        const createdFolder = await res.json();
        setFolders((prev) => [...prev, createdFolder]);
        setNewFolderName("");
        setIsFolderModalOpen(false);
      } else {
        console.error("Failed to create folder");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setProcessing(false);
    }
  };

  const handleUploadFile = async () => {
    if (!selectedFile || !currentFolderId) {
      console.error("Missing file or folder target context.");
      return;
    }

    setProcessing(true); 

    try {
      const formData = new FormData();
      formData.append("file", selectedFile); 
      formData.append("userId", userId); 
      formData.append("folderId", currentFolderId);

      const res = await fetch("http://localhost:8080/api/v1/resources/upload", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const uploadedResources = await res.json();
        console.log("Uploaded successfully:", uploadedResources);
        fetchFoldersAndFiles();
        setSelectedFile(null);
        setIsFileModalOpen(false);
      } else {
        const errorText = await res.text().catch(() => "No detailed error text available");
        console.error(`Failed to upload file. Status: ${res.status}. Server response: ${errorText}`);
      }
    } catch (err) {
      console.error("Network or client boundary crash while uploading:", err);
    } finally {
      setProcessing(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  if (loading) {
    return (
      <div className="w-full max-w-2xl border border-[#eacf8c] rounded-xl bg-white/15 backdrop-blur-[10px] p-8 shadow-xl text-center">
        <p className="font-mono text-sm text-[#eacf8c] animate-pulse">Consulting the scroll archives...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full max-w-2xl border border-red-400/50 rounded-xl bg-red-950/20 backdrop-blur-[10px] p-6 shadow-xl text-center">
        <p className="font-mono text-sm text-red-300">⚠️ {error}</p>
      </div>
    );
  }

  return (
    <div className="relative w-full max-w-4xl border border-[#eacf8c] rounded-xl bg-white/15 backdrop-blur-[10px] p-6 pb-20 shadow-xl text-left mb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 border-b border-[#eacf8c]/30 pb-3">
        <div className="flex items-center gap-3">
          <h3 className="font-mono text-sm font-bold text-[#eacf8c] tracking-wider uppercase">
            Course Archives
          </h3>
          <span className="text-[10px] font-mono text-[#CEA864] bg-white/10 px-2 py-0.5 rounded">
            {folders.length} Folders / {files.length} Files
          </span>
        </div>

        {/* View mode toggler */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode("grid")}
            className={`p-1 rounded transition duration-150 ${
              viewMode === "grid" ? "bg-white/20 border border-[#eacf8c]/40" : "opacity-60 hover:opacity-100"
            }`}
            title="Grid View (Single Coin)"
          >
            <img src="/assets/single_coin.png" alt="Grid View" className="w-5 h-5 object-contain" />
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`p-1 rounded transition duration-150 ${
              viewMode === "list" ? "bg-white/20 border border-[#eacf8c]/40" : "opacity-60 hover:opacity-100"
            }`}
            title="List View (Stacked Coins)"
          >
            <img src="/assets/coin-stacked.png" alt="List View" className="w-5 h-5 object-contain" />
          </button>
        </div>
      </div>

      {/* Navigation History Path / Back Button */}
      {history.length > 0 && (
        <div 
          className="flex items-center gap-2 p-2.5 rounded-lg bg-white/5 hover:bg-white/10 border border-dashed border-[#eacf8c]/30 hover:border-[#eacf8c]/50 transition duration-200 cursor-pointer mb-4 font-mono text-xs text-[#eacf8c]"
          onClick={handleGoBack}
        >
          <span>⬅️ Go Back to Previous Chamber</span>
        </div>
      )}

      {/* Folders and Files list */}
      {(folders.length > 0 || files.length > 0) ? (
        <div className="max-h-[450px] overflow-y-auto pr-1">
          {viewMode === "list" ? (
            /* LIST VIEW */
            <div className="space-y-2">
              {folders.map((folder) => (
                <div
                  key={folder.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 border border-[#eacf8c]/10 hover:border-[#eacf8c]/40 transition duration-200 group cursor-pointer"
                  onClick={() => handleFolderClick(folder.id)}
                >
                  <div className="flex items-center gap-3">
                    <img
                      src="/assets/magicball.png"
                      alt="Folder Icon"
                      className="w-7 h-7 object-contain"
                    />
                    <span className="font-mono text-sm tracking-wide" style={{ color: "#eac48c" }}>
                      {folder.name}
                    </span>
                  </div>
                  <button
                    className="opacity-50 hover:opacity-100 hover:scale-105 transition duration-150 p-1.5 rounded bg-white/5 border border-transparent hover:border-[#eacf8c]/25"
                    onClick={(e) => {
                      e.stopPropagation();
                      console.log(`Action menu for folder: ${folder.name}`);
                    }}
                  >
                    <img
                      src="/assets/quillV2.png"
                      alt="Action Menu"
                      className="w-4 h-4 object-contain"
                    />
                  </button>
                </div>
              ))}

              {files.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 border border-[#eacf8c]/10 hover:border-[#eacf8c]/40 transition duration-200 group cursor-pointer"
                  onClick={() => file.webViewLink && window.open(file.webViewLink, "_blank")}
                >
                  <div className="flex items-center gap-3">
                    <img
                      src="/assets/magic_openbook.png"
                      alt="File Icon"
                      className="w-7 h-7 object-contain"
                    />
                    <span className="font-mono text-sm tracking-wide" style={{ color: "#eac48c" }}>
                      {file.name}
                    </span>
                  </div>
                  <button
                    className="opacity-50 hover:opacity-100 hover:scale-105 transition duration-150 p-1.5 rounded bg-white/5 border border-transparent hover:border-[#eacf8c]/25"
                    onClick={(e) => {
                      e.stopPropagation();
                      console.log(`Action menu for file: ${file.name}`);
                    }}
                  >
                    <img
                      src="/assets/quillV2.png"
                      alt="Action Menu"
                      className="w-4 h-4 object-contain"
                    />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            /* GRID VIEW */
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {folders.map((folder) => (
                <div
                  key={folder.id}
                  className="relative flex flex-col items-center p-4 rounded-lg bg-white/5 hover:bg-white/10 border border-[#eacf8c]/10 hover:border-[#eacf8c]/40 transition duration-200 group cursor-pointer text-center"
                  onClick={() => handleFolderClick(folder.id)}
                >
                  <button
                    className="absolute top-2 right-2 opacity-50 hover:opacity-100 hover:scale-105 transition duration-150 p-1 rounded"
                    onClick={(e) => {
                      e.stopPropagation();
                      console.log(`Action menu for: ${folder.name}`);
                    }}
                  >
                    <img
                      src="/assets/quillV2.png"
                      alt="Action Menu"
                      className="w-3.5 h-3.5 object-contain"
                    />
                  </button>
                  <img
                    src="/assets/magicball.png"
                    alt="Folder Icon"
                    className="w-12 h-12 object-contain mb-2 group-hover:scale-110 transition duration-200"
                  />
                  <span className="font-mono text-xs truncate w-full px-1 group-hover:whitespace-normal group-hover:overflow-visible group-hover:text-clip" style={{ color: "#eac48c" }} title={folder.name}>
                    {folder.name}
                  </span>
                </div>
              ))}

              {files.map((file) => (
                <div
                  key={file.id}
                  className="relative flex flex-col items-center p-4 rounded-lg bg-white/5 hover:bg-white/10 border border-[#eacf8c]/10 hover:border-[#eacf8c]/40 transition duration-200 group cursor-pointer text-center"
                  onClick={() => file.webViewLink && window.open(file.webViewLink, "_blank")}
                >
                  <button
                    className="absolute top-2 right-2 opacity-50 hover:opacity-100 hover:scale-105 transition duration-150 p-1 rounded"
                    onClick={(e) => {
                      e.stopPropagation();
                      console.log(`Action menu for: ${file.name}`);
                    }}
                  >
                    <img
                      src="/assets/quillV2.png"
                      alt="Action Menu"
                      className="w-3.5 h-3.5 object-contain"
                    />
                  </button>
                  <img
                    src="/assets/magic_openbook.png"
                    alt="File Icon"
                    className="w-12 h-12 object-contain mb-2 group-hover:scale-110 transition duration-200"
                  />
                  <span className="font-mono text-xs truncate w-full px-1 group-hover:whitespace-normal group-hover:overflow-visible group-hover:text-clip" style={{ color: "#eac48c" }} title={file.name}>
                    {file.name}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-8">
          <img
            src="/assets/empty_treasure.png"
            alt="Empty Archives"
            className="w-12 h-12 object-contain mx-auto opacity-60 mb-2"
          />
          <p className="font-mono text-xs text-[#CEA864]/80">
            No chambers or files are cataloged in this directory yet.
          </p>
        </div>
      )}

      {/* Floating Add Menu */}
      <div className="absolute bottom-4 right-4 z-35">
        {showAddMenu && (
          <div className="absolute bottom-14 right-0 bg-slate-950 border border-[#eacf8c] rounded-xl p-2 flex flex-col gap-1.5 shadow-2xl min-w-[140px] animate-in fade-in slide-in-from-bottom-2 duration-150">
            <button
              onClick={() => {
                setIsFolderModalOpen(true);
                setShowAddMenu(false);
              }}
              className="w-full text-left font-mono text-xs text-[#eacf8c] hover:bg-white/10 px-3 py-2 rounded-lg transition"
            >
              📁 Add Folder
            </button>
            <button
              onClick={() => {
                setIsFileModalOpen(true);
                setShowAddMenu(false);
              }}
              className="w-full text-left font-mono text-xs text-[#eacf8c] hover:bg-white/10 px-3 py-2 rounded-lg transition"
            >
              📖 Add File
            </button>
          </div>
        )}
        <button
          className="hover:scale-110 active:scale-95 transition duration-150 cursor-pointer shadow-lg"
          title="Add More Options"
          onClick={() => setShowAddMenu((prev) => !prev)}
        >
          <img src="/assets/add.png" alt="Add More" className="w-11 h-11 object-contain" />
        </button>
      </div>

      {/* Modal: Add Folder */}
      {isFolderModalOpen && (
        <div className="modal-backdrop z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs fixed inset-0" onClick={() => setIsFolderModalOpen(false)}>
          <div className="rpg-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="rpg-modal-inner">
              <div className="rpg-modal-header">
                <img src="/assets/map.png" alt="Map Icon" className="rpg-modal-icon" />
                <h3 className="rpg-modal-title">Add Folder</h3>
              </div>
              <div className="rpg-modal-body">
                <label className="rpg-modal-label">Folder Name</label>
                <input
                  type="text"
                  className="rpg-modal-input"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="e.g. Assignments"
                  autoFocus
                />
              </div>
              <div className="rpg-modal-footer flex gap-4 justify-center mt-4">
                <button
                  className="rpg-icon-btn hover:scale-105 active:scale-95 transition"
                  onClick={() => {
                    setIsFolderModalOpen(false);
                    setNewFolderName("");
                  }}
                  disabled={processing}
                >
                  <img src="/assets/cancel.png" alt="Cancel" className="w-8 h-8" />
                </button>
                <button
                  className="rpg-icon-btn hover:scale-105 active:scale-95 transition"
                  onClick={handleAddFolder}
                  disabled={processing || !newFolderName.trim()}
                >
                  <img src="/assets/ok.png" alt="OK" className="w-8 h-8" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Add File */}
      {isFileModalOpen && (
        <div className="modal-backdrop z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs fixed inset-0" onClick={() => setIsFileModalOpen(false)}>
          <div className="rpg-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="rpg-modal-inner">
              <div className="rpg-modal-header">
                <img src="/assets/map.png" alt="Map Icon" className="rpg-modal-icon" />
                <h3 className="rpg-modal-title">Upload Scroll</h3>
              </div>
              <div className="rpg-modal-body">
                <label className="rpg-modal-label">Select File</label>
                <div className="relative group border border-dashed border-[#eacf8c]/40 rounded-lg p-6 bg-slate-900/50 hover:bg-slate-900 transition flex flex-col items-center justify-center text-center">
                  <input
                    type="file"
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    disabled={processing}
                  />
                  {selectedFile ? (
                    <div className="space-y-1 border rounded-sm p-3">
                      <p className="font-mono text-xs text-[#1a0f05] font-bold truncate max-w-xs">{selectedFile.name}</p>
                      <p className="text-[10px] text-slate-500 font-mono">{(selectedFile.size / 1024).toFixed(1)} KB</p>
                    </div>
                  ) : (
                    <div className="space-y-1 border rounded-sm p-3">
                      <span className="text-2xl">📖</span>
                      <p className="font-mono text-xs text-[#CEA864]">Click to pick local file</p>
                    </div>
                  )}
                </div>
              </div>
              <div className="rpg-modal-footer flex gap-4 justify-center mt-4">
                <button
                  className="rpg-icon-btn hover:scale-105 active:scale-95 transition"
                  onClick={() => {
                    setIsFileModalOpen(false);
                    setSelectedFile(null);
                  }}
                  disabled={processing}
                >
                  <img src="/assets/cancel.png" alt="Cancel" className="w-8 h-8" />
                </button>
                <button
                  className="rpg-icon-btn hover:scale-105 active:scale-95 transition"
                  onClick={handleUploadFile}
                  disabled={processing || !selectedFile}
                >
                  <img src="/assets/ok.png" alt="OK" className="w-8 h-8" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CourseFolderViewerSuspended() {
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [gemsCount, setGemsCount] = useState(1345);
  const [courseName, setCourseName] = useState("Course");
  const [semesterId, setSemesterId] = useState<string | null>(null);
  
  const searchParams = useSearchParams();
  const courseId = searchParams.get("courseId");
  
  const [userId, setUserId] = useState<string>("2deb6920-19b0-4fa9-aa5f-6364b03bce5d"); // Default static User ID

  useEffect(() => {
    const id = localStorage.getItem("user_id");
    if (id) {
      setUserId(id);
    }
  }, []);

  return (
    <div className="homepage-container">
      <div className="homepage-overlay" />

      {/* Dynamic CourseTopBar */}
      <CourseTopBar
        courseName={courseName}
        level={semesterId ? "Room" : "Back"}
        gems={gemsCount}
        onBack={() => {
          if (semesterId) {
            router.push(`/room_viewer?roomId=${semesterId}`);
          } else {
            router.push("/homepage");
          }
        }}
        onBookClick={() => setIsSidebarOpen(true)}
      />

      <div
        className="homepage-content"
        style={{ display: "flex", flexDirection: "column", gap: "25px", alignItems: "center", marginTop: "15px" }}
      >
        {courseId ? (
          <div className="px-6 py-4 w-full flex justify-center">
            <CourseViewerContent 
              courseId={courseId} 
              userId={userId} 
              onCourseDetailsFetched={(name, semId) => {
                setCourseName(name);
                setSemesterId(semId);
              }}
            />
          </div>
        ) : (
          <div className="w-full max-w-2xl border border-[#eacf8c]/40 rounded-xl bg-white/10 backdrop-blur-[10px] p-8 shadow-xl text-center">
            <p className="font-mono text-sm text-[#CEA864]">
              No course folder is currently selected. Return to the Room Viewer to select one.
            </p>
          </div>
        )}
      </div>

      {/* Sidebar Component */}
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      {/* Enforce strict global typography alignment overrides */}
      <style jsx global>{`
        * {
          font-family: 'Press Start 2P', monospace !important;
        }
      `}</style>
    </div>
  );
}

export default function CourseFolderViewerPage() {
  return (
    <Suspense fallback={<div>Loading Course Archives...</div>}>
      <CourseFolderViewerSuspended />
    </Suspense>
  );
}
