'use client';

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import Sidebar from "../components/Sidebar";
import GemCounter from "../components/GemCounter"; // Adjust path if necessary
import RoomTopBar from "../components/RoomTopBar";
import "../auth_init/auth.css";
import "../homepage/homepage.css";

/* ==========================================
   1. HOMEPAGE TOP BAR COMPONENT
   ========================================== */
interface HomepageTopBarProps {
  gems: number;
  onFrameClick?: () => void;
}

function HomePageTopBar({ gems, onFrameClick }: HomepageTopBarProps) {
  return (
    <div className="topbar">
      {/* Left: Runekeeper title */}
      <span className="title">Runekeeper</span>

      {/* Right: gems + frame/achievement icon */}
      <div className="right">
        <GemCounter count={gems} />
        <button className="icon-btn" onClick={onFrameClick}>
          <Image src="/assets/frame-1.png" alt="achievements" width={32} height={32} />
        </button>
      </div>

      <style jsx>{`
        .topbar {
          position: relative;
          z-index: 2;
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          height: 52px;
          background: transparent;
          padding: 0 14px;
          box-sizing: border-box;
        }
        .title {
          font-family: "Press Start 2P", monospace;
          font-size: 18px;
          color: #323921;
          letter-spacing: 2px;
          text-shadow: 2px 2px 0 #CFA965, 0 2px 2px #00000099;
        }
        .right {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .icon-btn {
          background: none;
          border: none;
          cursor: pointer;
          padding: 0;
          display: flex;
          align-items: center;
          z-index: 2;
        }
      `}</style>
    </div>
  );
}

/* ==========================================
   2. TYPES & INTERFACES
   ========================================== */
interface CourseResponseType {
  id: string;          
  name: string;        
  semesterId: string;  
  rootFolderId: string;
}

interface RoomDetailsType {
  id: string;
  name: string;
  ownerId: string;
  driveFolderId: string | null;
}

interface DirectoryViewerProps {
  roomId: string;
  userId: string;
  onRoomDetailsFetched?: (details: RoomDetailsType) => void;
}

/* ==========================================
   3. MAIN ARCHIVE / DIRECTORY VIEWER
   ========================================== */
function DirectoryViewer({ roomId, userId, onRoomDetailsFetched }: DirectoryViewerProps) {
  const router = useRouter();
  const [folders, setFolders] = useState<CourseResponseType[]>([]);
  const [roomDetails, setRoomDetails] = useState<RoomDetailsType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");

  // Folder creation states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    const fetchRoomAndCourses = async () => {
      setLoading(true);
      setError(null);
      try {
        const roomRes = await fetch(`http://localhost:8080/api/v1/rooms/${roomId}`);
        if (!roomRes.ok) {
          throw new Error("Failed to load room details.");
        }
        const roomData: RoomDetailsType = await roomRes.json();
        setRoomDetails(roomData);
        if (onRoomDetailsFetched) {
          onRoomDetailsFetched(roomData);
        }

        const coursesRes = await fetch(`http://localhost:8080/api/v1/rooms/${roomId}/courses`);
        if (coursesRes.ok) {
          const coursesData = await coursesRes.json();
          setFolders(coursesData || []);
        } else {
          console.warn("Failed to fetch relational courses mapped to this room.");
        }
        
      } catch (err: any) {
        console.error(err);
        setError(err.message || "Unable to sync directory.");
      } finally {
        setLoading(false);
      }
    };

    if (roomId) {
      fetchRoomAndCourses();
    }
  }, [roomId]); 

  const handleAddFolder = async () => {
    if (!newFolderName.trim()) return; 
    setCreating(true);
    
    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (userId) {
        headers["X-User-Id"] = userId;
      }

      const res = await fetch(
        `http://localhost:8080/api/v1/rooms/${roomId}/courses`, 
        {
          method: "POST",
          headers: headers,
          body: JSON.stringify({
            name: newFolderName.trim(),
            semesterId: roomId 
          }),
        }
      );

      if (res.ok) {
        const createdCourse = await res.json();
        setFolders((prev) => [...prev, createdCourse]);
        setNewFolderName("");
        setIsAddModalOpen(false);
      } else {
        console.error("Failed to create Course structural infrastructure");
      }
    } catch (err) {
      console.error("Error creating course workflow:", err);
    } finally {
      setCreating(false);
    }
  }; 

  if (loading) {
    return (
      <div className="w-full max-w-2xl border border-[#eacf8c] rounded-xl bg-white/15 backdrop-blur-[10px] p-8 shadow-xl text-center">
        <p className="text-sm text-[#eacf8c] animate-pulse">Consulting the scroll archives...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full max-w-2xl border border-red-400/50 rounded-xl bg-red-950/20 backdrop-blur-[10px] p-6 shadow-xl text-center">
        <p className="text-sm text-red-300">⚠️ {error}</p>
      </div>
    );
  }

  return (
    <div className="relative w-full max-w-4xl border border-[#eacf8c] rounded-xl bg-white/15 backdrop-blur-[10px] p-6 pb-20 shadow-xl text-left mb-6">
      {/* Directory Header */}
      <div className="flex items-center justify-between mb-4 border-b border-[#eacf8c]/30 pb-3">
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-bold text-[#eacf8c] tracking-wider uppercase">
            {roomDetails?.name ? `Room: ${roomDetails.name}` : "Archives Directory"}
          </h3>
          <span className="text-[10px] text-[#CEA864] bg-white/10 px-2 py-0.5 rounded">
            {folders.length} Folder{folders.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* View Switcher Toggles */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode("grid")}
            className={`p-1 rounded transition duration-150 ${
              viewMode === "grid" ? "bg-white/20 border border-[#eacf8c]/40" : "opacity-60 hover:opacity-100"
            }`}
            title="Grid View (Single Coin)"
          >
            <img src="/assets/single_coin.png" alt="Single Coin Grid" className="w-5 h-5 object-contain" />
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`p-1 rounded transition duration-150 ${
              viewMode === "list" ? "bg-white/20 border border-[#eacf8c]/40" : "opacity-60 hover:opacity-100"
            }`}
            title="List View (Stacked Coins)"
          >
            <img src="/assets/coin-stacked.png" alt="Stacked Coins List" className="w-5 h-5 object-contain" />
          </button>
        </div>
      </div>

      {/* Directory Contents */}
      {folders.length > 0 ? (
        <div className="max-h-[450px] overflow-y-auto pr-1">
          {viewMode === "list" ? (
            /* List View */
            <div className="space-y-2">
              {folders.map((folder) => (
                <div
                  key={folder.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 border border-[#eacf8c]/10 hover:border-[#eacf8c]/40 transition duration-200 group cursor-pointer"
                  onClick={() => router.push(`/course_viewer?courseId=${folder.id}`)}
                >
                  <div className="flex items-center gap-3">
                    <img
                      src="/assets/magicball.png"
                      alt="Folder Icon"
                      className="w-7 h-7 object-contain group-hover:scale-110 transition duration-200"
                    />
                    <span className="text-sm tracking-wide" style={{ color: "#eac48c" }}>
                      {folder.name}
                    </span>
                  </div>
                  {/* Action Menu Container: Positioned relative to handle layering properly */}
                  <button
                    className="relative opacity-50 hover:opacity-100 hover:scale-105 transition duration-150 p-1.5 rounded bg-white/5 border border-transparent hover:border-[#eacf8c]/25"
                    style={{ zIndex: 2 }}
                    title="Folder Action"
                    onClick={(e) => {
                      e.stopPropagation();
                      console.log(`Action menu for: ${folder.name}`);
                    }}
                  >
                    <img
                      src="/assets/quillV2.png"
                      alt="Action Quill"
                      className="w-4 h-4 object-contain"
                      style={{ position: "relative", zIndex: 1 }} /* Layer behind context action interactions */
                    />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            /* Grid / Icon View */
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {folders.map((folder) => (
                <div
                  key={folder.id}
                  className="relative flex flex-col items-center p-4 rounded-lg bg-white/5 hover:bg-white/10 border border-[#eacf8c]/10 hover:border-[#eacf8c]/40 transition duration-200 group cursor-pointer text-center"
                  onClick={() => router.push(`/course_viewer?courseId=${folder.id}`)}
                >
                  <button
                    className="absolute top-2 right-2 opacity-50 hover:opacity-100 hover:scale-105 transition duration-150 p-1"
                    style={{ zIndex: 2 }}
                    title="Folder Action"
                    onClick={(e) => {
                      e.stopPropagation();
                      console.log(`Action menu for: ${folder.name}`);
                    }}
                  >
                    <img
                      src="/assets/quillV2.png"
                      alt="Action Quill"
                      className="w-3.5 h-3.5 object-contain"
                      style={{ position: "relative", zIndex: 1 }} /* Layer behind context action interactions */
                    />
                  </button>
                  <img
                    src="/assets/magicball.png"
                    alt="Folder Icon"
                    className="w-12 h-12 object-contain mb-2 group-hover:scale-110 transition duration-200"
                  />
                  <span className="text-xs truncate w-full px-1 group-hover:whitespace-normal group-hover:overflow-visible group-hover:text-clip" style={{ color: "#eac48c" }} title={folder.name}>
                    {folder.name}
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
          <p className="text-xs text-[#CEA864]/80">
            No chambers or folders are cataloged in this room yet.
          </p>
        </div>
      )}

      {/* Add Course Button container */}
      <div className="absolute bottom-4 right-4 flex flex-col items-center gap-1 z-20">
        <button
          className="hover:scale-110 active:scale-95 transition duration-150 cursor-pointer p-0"
          title="Add Course Folder"
          onClick={() => setIsAddModalOpen(true)}
        >
          <img
            src="/assets/add.png"
            alt="Add Course"
            className="w-11 h-11 object-contain"
          />
        </button>
        <span className="text-[10px] text-[#eacf8c] tracking-wide">
          Add Course
        </span>
      </div>

      {/* Modal to Add Course / Folder */}
      {isAddModalOpen && (
        <div className="modal-backdrop z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs fixed inset-0" onClick={() => setIsAddModalOpen(false)}>
          <div className="rpg-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="rpg-modal-inner">
              <div className="rpg-modal-header">
                <img src="/assets/map.png" alt="Map Icon" className="rpg-modal-icon" />
                <h3 className="rpg-modal-title">Add Course Folder</h3>
              </div>
              <div className="rpg-modal-body">
                <label className="rpg-modal-label">Enter Folder Name</label>
                <input
                  type="text"
                  className="rpg-modal-input"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="e.g. CSE-311"
                  autoFocus
                />
              </div>
              <div className="rpg-modal-footer flex gap-4 justify-center mt-4">
                <button 
                  className="rpg-icon-btn hover:scale-105 active:scale-95 transition" 
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setNewFolderName("");
                  }}
                  disabled={creating}
                >
                  <img src="/assets/cancel.png" alt="Cancel" className="w-8 h-8" />
                </button>
                <button 
                  className="rpg-icon-btn hover:scale-105 active:scale-95 transition" 
                  onClick={handleAddFolder}
                  disabled={creating || !newFolderName.trim()}
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

/* ==========================================
   4. LAYOUT CONTROLLER & TOPBAR CONTAINER
   ========================================== */
function RoomViewerContent() {
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [gemsCount, setGemsCount] = useState(1345); // Set to 1345 like in the mockup
  const [roomDetails, setRoomDetails] = useState<RoomDetailsType | null>(null);
  const searchParams = useSearchParams();
  const roomId = searchParams.get("roomId");
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
      
      {/* Dynamic TopBar Embedded on Top */}
      <RoomTopBar 
        roomCode={roomDetails?.id ? roomDetails.id.slice(0, 4) : "1234"}
        level={roomDetails?.name || "L2T1"}
        gems={gemsCount}
        onBack={() => router.push("/homepage")}
        onBookClick={() => setIsSidebarOpen(true)}
      />
      
      <div 
        className="homepage-content max-w-6xl" 
        style={{ display: "flex", flexDirection: "column", gap: "25px", alignItems: "center", marginTop: "15px" }}
      >
        {roomId ? (
          <div className="px-6 py-4 w-full flex justify-center">
            <DirectoryViewer 
              roomId={roomId} 
              userId={userId} 
              onRoomDetailsFetched={(details) => setRoomDetails(details)}
            />
          </div>
        ) : (
          <div className="w-full max-w-6xl border border-[#eacf8c]/40 rounded-xl bg-white/10 backdrop-blur-[10px] p-8 shadow-xl text-center">
            <p className="text-sm text-[#CEA864]">
              No room is currently selected. Return to the homepage to select one.
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

/* ==========================================
   5. EXPORT PAGE WRAPPER
   ========================================== */
export default function RoomViewerPage() {
  return (
    <Suspense fallback={<div style={{ fontFamily: "'Press Start 2P', monospace", padding: "20px" }}>Loading Room Viewer...</div>}>
      <RoomViewerContent />
    </Suspense>
  );
}