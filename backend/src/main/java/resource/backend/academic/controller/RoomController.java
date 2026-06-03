package resource.backend.academic.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import resource.backend.academic.entity.Semester;
import resource.backend.academic.service.RoomService;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/rooms")
@CrossOrigin(origins = "http://localhost:3000")
@RequiredArgsConstructor
@Slf4j
public class RoomController {

    private final RoomService roomService;

    public record CreateRoomRequest(String name, UUID ownerId) {}
    public record RoomResponse(UUID id, String name, UUID ownerId, String driveFolderId) {}

    @PostMapping
    public ResponseEntity<RoomResponse> createRoom(@RequestBody CreateRoomRequest request) {
        log.info("Request to create room '{}' for user '{}'", request.name(), request.ownerId());
        if (request.name() == null || request.name().trim().isEmpty()) {
            return ResponseEntity.badRequest().build();
        }
        if (request.ownerId() == null) {
            return ResponseEntity.badRequest().build();
        }

        Semester semester = roomService.createRoom(request.name().trim(), request.ownerId());
        String driveFolderId = roomService.getRoomDriveFolderId(semester.getOwner().getId(), semester.getName());
        RoomResponse response = new RoomResponse(
                semester.getId(),
                semester.getName(),
                semester.getOwner().getId(),
                driveFolderId
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    public ResponseEntity<List<RoomResponse>> getRooms(@RequestParam UUID ownerId) {
        log.info("Request to get rooms for user '{}'", ownerId);
        List<Semester> semesters = roomService.getRoomsByOwner(ownerId);
        List<RoomResponse> response = semesters.stream()
                .map(s -> {
                    String driveFolderId = roomService.getRoomDriveFolderId(s.getOwner().getId(), s.getName());
                    return new RoomResponse(s.getId(), s.getName(), s.getOwner().getId(), driveFolderId);
                })
                .collect(Collectors.toList());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<RoomResponse> getRoom(@PathVariable UUID id) {
        log.info("Request to get room details for ID '{}'", id);
        Semester semester = roomService.getRoomById(id);
        if (semester == null) {
            return ResponseEntity.notFound().build();
        }
        String driveFolderId = roomService.getRoomDriveFolderId(semester.getOwner().getId(), semester.getName());
        RoomResponse response = new RoomResponse(
                semester.getId(),
                semester.getName(),
                semester.getOwner().getId(),
                driveFolderId
        );
        return ResponseEntity.ok(response);
    }
}
