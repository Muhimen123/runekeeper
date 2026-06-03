package resource.backend.resource.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import resource.backend.resource.entity.Resource;
import resource.backend.resource.repository.ResourceRepository;

import java.util.List;
import java.util.UUID;

/**
 * Controller for browsing and listing resources stored in the database.
 */
@Slf4j
@RestController
@RequestMapping("/api/resources")
@RequiredArgsConstructor
public class ResourceController {

    private final ResourceRepository resourceRepository;

    /**
     * Returns all resources belonging to a specific folder.
     * Used by the CourseFolderViewer frontend to list clickable contents.
     *
     * @param folderId The UUID of the folder
     * @return List of resource summary DTOs
     */
    @GetMapping("/folder/{folderId}")
    public ResponseEntity<List<ResourceSummary>> getResourcesByFolder(
            @PathVariable UUID folderId) {

        log.info("Fetching resources for folder {}", folderId);

        List<Resource> resources = resourceRepository.findByFolderIdOrderByCreatedAtDesc(folderId);

        List<ResourceSummary> summaries = resources.stream()
                .map(r -> new ResourceSummary(
                        r.getId(),
                        r.getName(),
                        r.getDescription(),
                        r.getMimeType(),
                        r.getResourceType().name(),
                        r.getDriveUrl(),
                        r.getLikeCount(),
                        r.getViewCount()
                ))
                .toList();

        return ResponseEntity.ok(summaries);
    }

    /**
     * Lightweight summary of a resource for listing purposes.
     * Avoids exposing sensitive internal fields like driveFileId.
     */
    public record ResourceSummary(
            UUID id,
            String name,
            String description,
            String mimeType,
            String resourceType,
            String driveUrl,
            Integer likeCount,
            Integer viewCount
    ) {}
}
