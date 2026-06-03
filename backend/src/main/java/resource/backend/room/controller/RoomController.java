package resource.backend.room.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import resource.backend.room.model.RoomSession;
import resource.backend.room.service.MemoryRoomService;

import java.util.UUID;

@RestController
@RequestMapping("/rooms")
@CrossOrigin(origins = "*") // Allow requests from Next.js frontend
public class RoomController {

    private final MemoryRoomService roomService;

    public RoomController(MemoryRoomService roomService) {
        this.roomService = roomService;
    }

    public record CreateRoomRequest(UUID ownerId, String type) {}

    /**
     * Endpoint: POST /api/v1/rooms/create
     * Creates a new live room in memory and generates the room code 
     */
    @PostMapping("/create")
    public ResponseEntity<RoomSession> createRoom(@RequestBody CreateRoomRequest request) {
        RoomSession session = roomService.createRoom(request.ownerId(), request.type());
        return ResponseEntity.ok(session);
    }

    /**
     * Endpoint: GET /api/v1/rooms/{roomCode}
     * Validates and returns the room if it's currently active
     */
    @GetMapping("/{roomCode}")
    public ResponseEntity<RoomSession> getRoomDetails(@PathVariable String roomCode) {
        return roomService.getRoomByCode(roomCode)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Endpoint: DELETE /api/v1/rooms/{roomCode}
     * End the live session when the user closes the whiteboard
     */
    @DeleteMapping("/{roomCode}")
    public ResponseEntity<Void> closeRoom(@PathVariable String roomCode) {
        roomService.removeRoom(roomCode);
        return ResponseEntity.noContent().build();
    }
}
