package resource.backend.room.model;

import java.time.Instant;
import java.util.UUID;

public class RoomSession {
    private String roomCode;
    private UUID ownerId;
    private String type; // e.g., "whiteboard", "focus"
    private Instant createdAt;

    public RoomSession(String roomCode, UUID ownerId, String type) {
        this.roomCode = roomCode;
        this.ownerId = ownerId;
        this.type = type != null ? type : "whiteboard";
        this.createdAt = Instant.now();
    }

    // Getters and Setters
    public String getRoomCode() {
        return roomCode;
    }

    public void setRoomCode(String roomCode) {
        this.roomCode = roomCode;
    }

    public UUID getOwnerId() {
        return ownerId;
    }

    public void setOwnerId(UUID ownerId) {
        this.ownerId = ownerId;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
}
