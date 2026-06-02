package resource.backend.resource.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import resource.backend.resource.dto.UpdateProgressRequest;
import resource.backend.resource.entity.UserResourceProgress;
import resource.backend.resource.service.SlideViewerService;
import resource.backend.resource.service.UserResourceProgressService;

import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * Controller to expose APIs for opening, viewing slide pages, and tracking cursor/study progress.
 */
@Slf4j
@RestController
@RequestMapping("/api/resources")
@RequiredArgsConstructor
public class SlideViewerController {

    private final SlideViewerService slideViewerService;
    private final UserResourceProgressService progressService;

    /**
     * Streams a specific page of a slide deck as a high-fidelity PNG image.
     *
     * @param resourceId The UUID of the slide resource
     * @param pageNumber The 1-based index of the slide page to view
     * @return Raw PNG image stream
     */
    @GetMapping(value = "/{resourceId}/slides/{pageNumber}", produces = MediaType.IMAGE_PNG_VALUE)
    public ResponseEntity<byte[]> getSlidePage(
            @PathVariable UUID resourceId,
            @PathVariable int pageNumber) {
        
        log.info("Request received to view slide page {} for resource {}", pageNumber, resourceId);
        
        byte[] imageBytes = slideViewerService.renderSlidePage(resourceId, pageNumber);
        
        return ResponseEntity.ok()
                .contentType(MediaType.IMAGE_PNG)
                .body(imageBytes);
    }

    /**
     * Updates the user's current slide progress percentage in the database.
     *
     * @param resourceId The UUID of the slide resource
     * @param userIdStr  The UUID of the user, passed via header "X-User-Id"
     * @param request    The page details (current page and total pages)
     * @return Compact progress status payload
     */
    @PutMapping("/{resourceId}/progress")
    public ResponseEntity<ProgressResponse> updateProgress(
            @PathVariable UUID resourceId,
            @RequestHeader(value = "X-User-Id", required = false) String userIdStr,
            @RequestBody UpdateProgressRequest request) {

        log.info("Request received to update slide progress for resource: {}", resourceId);

        if (userIdStr == null || userIdStr.isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "X-User-Id header is required to track progress.");
        }

        UUID userId;
        try {
            userId = UUID.fromString(userIdStr);
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Invalid UUID format in X-User-Id header.");
        }

        UserResourceProgress updated = progressService.updateProgress(
                userId,
                resourceId,
                request.currentSlide(),
                request.totalSlides()
        );

        ProgressResponse response = new ProgressResponse(
                updated.getId().getUserId(),
                updated.getId().getResourceId(),
                updated.getProgressPct(),
                updated.getLastAccessed()
        );

        return ResponseEntity.ok(response);
    }

    /**
     * Compact response payload to avoid full entity serialization.
     */
    public record ProgressResponse(
            UUID userId,
            UUID resourceId,
            Short progressPct,
            OffsetDateTime lastAccessed
    ) {}
}
