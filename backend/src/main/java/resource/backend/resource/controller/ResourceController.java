package resource.backend.resource.controller;

import java.io.IOException;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import resource.backend.resource.dto.ResourceResponse;
import resource.backend.resource.service.ResourceService;

@RestController
@RequestMapping("/resources")
@CrossOrigin(origins = "http://localhost:3000")
@RequiredArgsConstructor
@Slf4j
public class ResourceController {

    private final ResourceService resourceService;

    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<List<ResourceResponse>> uploadResources(
            @RequestParam String userId,
            @RequestParam("file") MultipartFile[] files,
            @RequestParam(required = false) String folderId) {
        log.info("Request received to upload {} file(s) for user: {} under folder: {}", files.length, userId, folderId);
        try {
            List<ResourceResponse> uploadedResources = resourceService.uploadResources(userId, files, folderId);
            return ResponseEntity.status(HttpStatus.CREATED).body(uploadedResources);
        } catch (IOException e) {
            log.error("Failed to upload resources for user: {}", userId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        } catch (IllegalArgumentException e) {
            log.error("Invalid input format for user: {}", userId, e);
            return ResponseEntity.badRequest().build();
        }
    }
}
