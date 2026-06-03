"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import HomePageTopBar from "../components/HomePageTopBar";

export default function HomepagePage() {
    const router = useRouter();
    
    // Manage dynamic User ID from storage instead of hardcoding a demo key
    const [userId, setUserId] = useState<string | null>(null);
    const [rooms, setRooms] = useState<{ id: string; name: string }[]>([]);

    // Modal Visibility States
    const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    // Input states
    const [roomCode, setRoomCode] = useState("");
    const [roomName, setRoomName] = useState("");
    const [gems, setGems] = useState(0); 

    useEffect(() => {
        // Resolve authentication metadata safely on the client side mount
        const storedUserId = localStorage.getItem("user_id");
        const token = localStorage.getItem("supabase_token");

        // Guard clause: If no valid token is found, bounce them straight out to authentication vault
        if (!token || !storedUserId) {
            router.push("/");
            return;
        }

        setUserId(storedUserId);
        fetchRooms(storedUserId);
    }, []);

    const fetchRooms = async (currentUserId: string) => {
        try {
            // Include global context path prefix `/api/v1`
            const res = await fetch(`http://localhost:8080/api/v1/rooms?ownerId=${currentUserId}`);
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

    // 🔥 NEW: Trigger Google Drive Authorization Lifecycle Link Flow
    const handleConnectGoogleDrive = () => {
        if (!userId) return;
        // Triggers your Spring Boot Google OAuth Gateway using the dynamic state userId
        window.location.href = `http://localhost:8080/api/v1/oauth/connect?userId=${userId}`;
    };

    // ACTIVE LOGOUT ACTION FLOW ROUTINE
    const handleLogout = async () => {
        const token = localStorage.getItem("supabase_token");

        try {
            // Outbound sequence to destroy token mapping on the server infrastructure
            await fetch("http://localhost:8080/api/v1/auth/logout", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                }
            });
        } catch (err) {
            console.error("Failed to cleanly terminate session from server registry:", err);
        } finally {
            // ALWAYS wipe data tracks completely clean regardless of network status 
            localStorage.removeItem("supabase_token");
            localStorage.removeItem("user_id");

            // Redirect user back to public landing gate
            router.push("/");
        }
    };

    const handleRoomClick = (roomId: string) => {
        router.push(`/room_viewer?roomId=${roomId}`);
    };

    const submitCreateRoom = async () => {
        if (roomName.trim() && userId) {
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
            setRooms((prev) => [
                ...prev,
                { id: String(prev.length + 1), name: `Room #${roomCode.trim()}` },
            ]);
            setRoomCode("");
            setIsJoinModalOpen(false);
        }
    };

    // Keep layout rendering hidden while checking client session tokens to prevent visual flicker
    if (!userId) {
        return <div className="homepage-container"><div className="homepage-overlay" /></div>;
    }

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

                    {/* 🔥 NEW: Google Drive Link Option */}
                    <div className="rpg-wood-btn-wrap">
                        <button className="rpg-wood-btn text-emerald-400" onClick={handleConnectGoogleDrive}>
                            Connect Drive
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
                                        onClick={() => handleRoomClick(room.id)}
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