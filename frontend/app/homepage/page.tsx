"use client";

import React, { useState } from "react";
import HomePageTopBar from "../components/HomePageTopBar"; 

export default function HomepagePage() {
    const [rooms, setRooms] = useState([
        { id: "1", name: "T2L1" },
        { id: "2", name: "UwU" },
        { id: "3", name: "fsasgnfc" },
        { id: "4", name: "T2L1" },
        { id: "5", name: "RuneQuest" },
        { id: "6", name: "Mages Den" },
    ]);
    const [gems, setGems] = useState(1345); 

    // Modal Visibility States
    const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    // Input states
    const [roomCode, setRoomCode] = useState("");
    const [roomName, setRoomName] = useState("");

    const handleJoinExisting = () => {
        setIsJoinModalOpen(true);
    };

    const handleCreateNew = () => {
        setIsCreateModalOpen(true);
    };

    const handleLogout = () => {
        console.log("Logout clicked");
    };

    const handleRoomClick = (roomName: string) => {
        console.log(`Clicked room: ${roomName}`);
    };

    const submitCreateRoom = () => {
        if (roomName.trim()) {
            setRooms((prev) => [
                ...prev,
                { id: String(prev.length + 1), name: roomName.trim() },
            ]);
            setRoomName("");
            setIsCreateModalOpen(false);
        }
    };

    const submitJoinRoom = () => {
        if (roomCode.trim()) {
            // Simulate finding/joining a room
            setRooms((prev) => [
                ...prev,
                { id: String(prev.length + 1), name: `Room #${roomCode.trim()}` },
            ]);
            setRoomCode("");
            setIsJoinModalOpen(false);
        }
    };
    return (
    <div className="homepage-container">
        <div className="homepage-overlay" />

        {/* TOP BAR */}
        <HomePageTopBar gems={gems} onFrameClick={() => console.log("frame clicked")} />

        {/* PANELS */}
        <div className="homepage-content">
            {/* Left Panel */}
    <div className="left-panel">
                <div className="rpg-wood-btn-wrap">
                    <button className="rpg-wood-btn" onClick={handleJoinExisting}>
                        Join Room
                    </button>
                </div>

                <div className="rpg-wood-btn-wrap">
                    <button className="rpg-wood-btn" onClick={handleCreateNew}>
                        Create New Room
                    </button>
                </div>

                <div className="rpg-wood-btn-wrap">
                    <button className="rpg-wood-btn" onClick={handleLogout}>
                        Logout
                    </button>
                </div>
            </div>


            {/* Right Panel */}
           <div className="right-panel">
                <div className="rooms-card">
                    <h2 className="rooms-title">Joined Rooms</h2>

                    <div className="rooms-list-scroll">
                        {rooms.map((room) => (
                            <div key={room.id} className="rpg-dark-btn-wrap">
                                <button
                                    className="rpg-dark-btn"
                                    onClick={() => handleRoomClick(room.name)}
                                >
                                    {room.name}
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Dynamic mossy rocks decoration from assets */}
                <img
                    src="/assets/stone_1.png"
                    alt="Mossy Rock Left"
                    className="mossy-rock-left"
                />
                <img
                    src="/assets/stone_2.png"
                    alt="Mossy Rock Right"
                    className="mossy-rock-right"
                />
            </div>
        </div>

      {isCreateModalOpen && (
                <div className="modal-backdrop" onClick={() => setIsCreateModalOpen(false)}>
                    <div className="rpg-modal-card" onClick={(e) => e.stopPropagation()}>
                        <div className="rpg-modal-inner">
                            <div className="rpg-modal-header">
                                <img src="/assets/map.png" alt="Map Icon" className="rpg-modal-icon" />
                                <h3 className="rpg-modal-title">Create New Room</h3>
                            </div>
                            <div className="rpg-modal-body">
                                <label className="rpg-modal-label">Enter Name</label>
                                <input
                                    type="text"
                                    className="rpg-modal-input"
                                    value={roomName}
                                    onChange={(e) => setRoomName(e.target.value)}
                                    placeholder="e.g. L3T2"
                                    autoFocus
                                />
                            </div>
                            <div className="rpg-modal-footer">
                                <button className="rpg-icon-btn" onClick={() => setIsCreateModalOpen(false)}>
                                    <img src="/assets/cancel.png" alt="Cancel" />
                                </button>
                                <button className="rpg-icon-btn" onClick={submitCreateRoom}>
                                    <img src="/assets/ok.png" alt="OK" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal: Join Room */}
            {isJoinModalOpen && (
                <div className="modal-backdrop" onClick={() => setIsJoinModalOpen(false)}>
                    <div className="rpg-modal-card" onClick={(e) => e.stopPropagation()}>
                        <div className="rpg-modal-inner">
                            <div className="rpg-modal-header">
                                <img src="/assets/map.png" alt="Map Icon" className="rpg-modal-icon" />
                                <h3 className="rpg-modal-title">Join Existing Room</h3>
                            </div>
                            <div className="rpg-modal-body">
                                <label className="rpg-modal-label">Enter Code</label>
                                <input
                                    type="text"
                                    className="rpg-modal-input"
                                    value={roomCode}
                                    onChange={(e) => setRoomCode(e.target.value)}
                                    placeholder="e.g. 1234"
                                    autoFocus
                                />
                            </div>
                            <div className="rpg-modal-footer">
                                <button className="rpg-icon-btn" onClick={() => setIsJoinModalOpen(false)}>
                                    <img src="/assets/cancel.png" alt="Cancel" />
                                </button>
                                <button className="rpg-icon-btn" onClick={submitJoinRoom}>
                                    <img src="/assets/ok.png" alt="OK" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
    </div>
);
}
