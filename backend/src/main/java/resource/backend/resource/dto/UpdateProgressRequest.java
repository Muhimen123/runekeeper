package resource.backend.resource.dto;

/**
 * Request payload sent by frontend to track and update the active slide progress.
 *
 * @param currentSlide The 1-based page number the user is currently viewing
 * @param totalSlides  The total count of pages in this slide deck
 */
public record UpdateProgressRequest(
    Integer currentSlide,
    Integer totalSlides
) {}
