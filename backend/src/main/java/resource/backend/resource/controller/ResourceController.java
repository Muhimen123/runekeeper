package resource.backend.resource.controller; // Ensure this package matches your project structure

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import resource.backend.resource.dto.ResourceResponse;
import resource.backend.resource.service.ResourceService;

import java.util.List;

@RestController
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3000")
@RequestMapping("/resources") // Combined with global /api/v1 prefix, resolves to: /api/v1/resources
@Slf4j
public class ResourceController {

    private final ResourceService resourceService;

    /**
     * Fixes the File Upload 404 and aligns with ResourceService logic.
     * Maps to: POST http://localhost:8080/api/v1/resources/upload
     */
    @PostMapping("/upload")
    public ResponseEntity<List<ResourceResponse>> uploadResources(
            @RequestParam("file") MultipartFile[] files,
            @RequestParam("folderId") String folderId,
            // 🔥 Make ownerId optional so it won't crash with a 400 if missing
            @RequestParam(value = "ownerId", required = false) String ownerId) {

        log.info("Received upload API hit. Files count: {}, Folder target: {}, Owner target: {}",
                files.length, folderId, ownerId);

        // Hardcoded fallback Demo User ID if the frontend didn't supply one yet
        if (ownerId == null || ownerId.trim().isEmpty()) {
            ownerId = "2deb6920-19b0-4fa9-aa5f-6364b03bce5d";
            log.info("ownerId parameter was missing. Using temporary fallback Demo ID: {}", ownerId);
        }

        try {
            List<ResourceResponse> responses = resourceService.uploadResources(ownerId, files, folderId);
            return ResponseEntity.ok(responses);
        } catch (IllegalArgumentException e) {
            log.error("Validation error during resource upload processing: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(null);
        } catch (Exception e) {
            log.error("Fatal exception during resource upload pipeline execution", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }
}