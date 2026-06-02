package resource.backend.resource.service;

import com.groupdocs.viewer.Viewer;
import com.groupdocs.viewer.options.PngViewOptions;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.server.ResponseStatusException;
import resource.backend.resource.entity.Resource;
import resource.backend.resource.repository.ResourceRepository;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.util.UUID;

/**
 * Service to handle high-fidelity slide page rendering using GroupDocs.Viewer
 * and file retrieval from storage.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class SlideViewerService {

    private final ResourceRepository resourceRepository;
    private final RestClient restClient = RestClient.create();

    /**
     * Renders a specific slide page to raw PNG bytes.
     *
     * @param resourceId The UUID of the slide resource
     * @param pageNumber The 1-based page number to render
     * @return Raw PNG image bytes
     */
    public byte[] renderSlidePage(UUID resourceId, int pageNumber) {
        log.info("Rendering slide page {} for resource {}", pageNumber, resourceId);

        // 1. Fetch resource from the database
        Resource resource = resourceRepository.findById(resourceId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Slide resource not found with ID: " + resourceId));

        // 2. Download the original slide document (PDF/PPTX) from the storage URL
        byte[] fileBytes = downloadFile(resource.getDriveUrl());

        // 3. Render the specific page to PNG using GroupDocs.Viewer
        return convertPageToPng(fileBytes, pageNumber);
    }

    /**
     * Downloads a file as raw bytes from the given URL.
     */
    private byte[] downloadFile(String fileUrl) {
        try {
            log.info("Downloading slide file from: {}", fileUrl);
            byte[] bytes = restClient.get()
                    .uri(fileUrl)
                    .retrieve()
                    .body(byte[].class);

            if (bytes == null || bytes.length == 0) {
                throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Downloaded file is empty");
            }
            return bytes;
        } catch (Exception e) {
            log.error("Failed to download file from storage URL: {}", fileUrl, e);
            throw new ResponseStatusException(
                    HttpStatus.BAD_GATEWAY, "Could not fetch slide file from storage server.", e);
        }
    }

    /**
     * Converts a specific page of document bytes into PNG image bytes using GroupDocs.Viewer.
     */
    private byte[] convertPageToPng(byte[] fileBytes, int pageNumber) {
        try (InputStream inputStream = new ByteArrayInputStream(fileBytes);
             ByteArrayOutputStream outputStream = new ByteArrayOutputStream()) {

            // Load document stream into GroupDocs.Viewer
            try (Viewer viewer = new Viewer(inputStream)) {
                // Configure PNG options to capture the page output into our byte stream
                PngViewOptions viewOptions = new PngViewOptions(page -> outputStream);

                // Render the specific slide page
                viewer.view(viewOptions, pageNumber);
            }

            byte[] pngBytes = outputStream.toByteArray();
            if (pngBytes.length == 0) {
                throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Rendered page bytes are empty");
            }

            return pngBytes;
        } catch (Exception e) {
            log.error("GroupDocs.Viewer failed to render page {}", pageNumber, e);
            throw new ResponseStatusException(
                    HttpStatus.INTERNAL_SERVER_ERROR, "Error rendering slide page: " + e.getMessage(), e);
        }
    }
}
