package resource.backend.resource.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import resource.backend.resource.entity.Resource;
import resource.backend.resource.entity.UserResourceProgress;
import resource.backend.resource.entity.UserResourceProgressId;
import resource.backend.resource.repository.ResourceRepository;
import resource.backend.resource.repository.UserResourceProgressRepository;
import resource.backend.user.entity.User;
import resource.backend.user.repository.UserRepository;

import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * Service to handle student viewing progress updates on slides and resources.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class UserResourceProgressService {

    private final UserResourceProgressRepository progressRepository;
    private final UserRepository userRepository;
    private final ResourceRepository resourceRepository;

    /**
     * Calculates slide navigation progress percentage and upserts the progress database record.
     *
     * @param userId       The UUID of the student
     * @param resourceId   The UUID of the slide resource
     * @param currentSlide The 1-based slide index the student is viewing
     * @param totalSlides  The total count of slides in this deck
     * @return The updated UserResourceProgress entity
     */
    @Transactional
    public UserResourceProgress updateProgress(UUID userId, UUID resourceId, int currentSlide, int totalSlides) {
        log.info("Updating progress for user {}, resource {} (slide {}/{})", userId, resourceId, currentSlide, totalSlides);

        if (totalSlides <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Total slides must be greater than zero");
        }
        if (currentSlide < 1 || currentSlide > totalSlides) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Current slide must be between 1 and " + totalSlides);
        }

        // 1. Verify that user and resource exist (fail fast)
        if (!userRepository.existsById(userId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found with ID: " + userId);
        }
        if (!resourceRepository.existsById(resourceId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Resource not found with ID: " + resourceId);
        }

        // 2. Fetch existing progress or initialize a new record
        UserResourceProgressId progressId = new UserResourceProgressId(userId, resourceId);
        UserResourceProgress progress = progressRepository.findById(progressId)
                .orElseGet(() -> {
                    log.info("Creating new progress record for user {} and resource {}", userId, resourceId);
                    UserResourceProgress newProgress = new UserResourceProgress();
                    newProgress.setId(progressId);
                    // Use lazy reference proxies to avoid unnecessary SELECT queries
                    newProgress.setUser(userRepository.getReferenceById(userId));
                    newProgress.setResource(resourceRepository.getReferenceById(resourceId));
                    return newProgress;
                });

        // 3. Compute progress percentage (0 - 100)
        short progressPct = (short) Math.min(100, Math.max(0, (currentSlide * 100) / totalSlides));
        progress.setProgressPct(progressPct);
        progress.setLastAccessed(OffsetDateTime.now());

        return progressRepository.save(progress);
    }
}
