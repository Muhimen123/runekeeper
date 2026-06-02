"use client";

import React, { useState } from "react";
import Sidebar from "../components/Sidebar";
import "../auth_init/auth.css";
import "../homepage/homepage.css";

export default function RoomViewerPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="homepage-container">
      <div className="homepage-overlay" />
      
      <div 
        className="homepage-content" 
        style={{ display: "flex", flexDirection: "column", gap: "20px", alignItems: "center" }}
      >
        <h1 
          className="runekeeper-title"
          style={{ fontSize: "28px", color: "#323921", textShadow: "3px 3px 0 #CEA864, -3px -3px 0 #CEA864, 3px -3px 0 #CEA864, -3px 3px 0 #CEA864" }}
        >
          Room Viewer
        </h1>
        
        <p style={{ fontFamily: "'Press Start 2P', monospace", fontSize: "14px", color: "#E8C493", textShadow: "2px 2px 0 #000", textAlign: "center" }}>
          Welcome to the Room Viewer panel. Use the trigger button on the top right or below to view room details and events.
        </p>

        <div className="rpg-wood-btn-wrap" style={{ marginTop: "20px" }}>
          <button className="rpg-wood-btn" onClick={() => setIsSidebarOpen(true)}>
            Open Sidebar
          </button>
        </div>
      </div>

      {/* Floating Gear/Map Trigger Button at the top right corner */}
      <button className="sidebar-trigger-btn" onClick={() => setIsSidebarOpen(true)}>
        <img src="/assets/map.png" alt="Open Menu" />
      </button>

      {/* Sidebar Component */}
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
    </div>
  );
}
