package resource.backend.room.service;

import org.springframework.stereotype.Service;
import resource.backend.room.model.RoomSession;

import java.security.SecureRandom;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class MemoryRoomService {

    // Thread-safe map to hold live rooms in RAM
    private final Map<String, RoomSession> activeRooms = new ConcurrentHashMap<>();
    
    private static final String CHARACTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    private static final int CODE_LENGTH = 6;
    private final SecureRandom random = new SecureRandom();

    /**
     * Create a new room with a random 6-character code
     */
    public RoomSession createRoom(UUID ownerId, String type) {
        String code;
        RoomSession session;
        do {
            code = generateRandomCode();
            session = new RoomSession(code, ownerId, type);
        } while (activeRooms.putIfAbsent(code, session) != null); // Ensure uniqueness atomically

        return session;
    }

    /**
     * Look up a room by its code
     */
    public Optional<RoomSession> getRoomByCode(String code) {
        if (code == null) return Optional.empty();
        return Optional.ofNullable(activeRooms.get(code.toUpperCase()));
    }

    /**
     * End a session (can be called manually or via a scheduled clean-up job)
     */
    public void removeRoom(String code) {
        if (code != null) {
            activeRooms.remove(code.toUpperCase());
        }
    }

    private String generateRandomCode() {
        StringBuilder code = new StringBuilder(CODE_LENGTH);
        for (int i = 0; i < CODE_LENGTH; i++) {
            code.append(CHARACTERS.charAt(random.nextInt(CHARACTERS.length())));
        }
        return code.toString();
    }
}
