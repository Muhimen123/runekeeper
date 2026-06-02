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
    public record RoomResponse(UUID id, String name, UUID ownerId) {}

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
        RoomResponse response = new RoomResponse(
                semester.getId(),
                semester.getName(),
                semester.getOwner().getId()
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    public ResponseEntity<List<RoomResponse>> getRooms(@RequestParam UUID ownerId) {
        log.info("Request to get rooms for user '{}'", ownerId);
        List<Semester> semesters = roomService.getRoomsByOwner(ownerId);
        List<RoomResponse> response = semesters.stream()
                .map(s -> new RoomResponse(s.getId(), s.getName(), s.getOwner().getId()))
                .collect(Collectors.toList());
        return ResponseEntity.ok(response);
    }
}
