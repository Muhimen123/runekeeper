"use client";

import React, { useState, useEffect } from "react";

export default function HomepagePage() {
    const userId = "2deb6920-19b0-4fa9-aa5f-6364b03bce5d"; // Demo static User ID
    const [rooms, setRooms] = useState<{ id: string; name: string }[]>([]);

    // Modal Visibility States
    const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    // Input states
    const [roomCode, setRoomCode] = useState("");
    const [roomName, setRoomName] = useState("");

    useEffect(() => {
        fetchRooms();
    }, []);

    const fetchRooms = async () => {
        try {
            const res = await fetch(`http://localhost:8080/api/v1/rooms?ownerId=${userId}`);
            if (res.ok) {
                const data = await res.json();
                setRooms(data);
            }
        } catch (err) {
            console.error("Failed to fetch rooms:", err);
        }
    };

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

    const submitCreateRoom = async () => {
        if (roomName.trim()) {
            try {
                const res = await fetch("http://localhost:8080/api/v1/rooms", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        name: roomName.trim(),
                        ownerId: userId,
                    }),
                });
                if (res.ok) {
                    const newRoom = await res.json();
                    setRooms((prev) => [...prev, newRoom]);
                    setRoomName("");
                    setIsCreateModalOpen(false);
                } else {
                    console.error("Failed to create room:", res.statusText);
                }
            } catch (err) {
                console.error("Failed to create room:", err);
            }
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
        <>
            {/* Left Panel - Control Buttons */}
            <div className="left-panel">
                <div className="rpg-wood-btn-wrap">
                    <button className="rpg-wood-btn" onClick={handleJoinExisting}>
                        Join Existing Room
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

            {/* Right Panel - Joined Rooms with Scrollable Custom Buttons */}
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

            {/* Modal: Create Room */}
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
        </>
    );
}
