package resource.backend.gdrive.controller;

import java.io.IOException;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.http.MediaType;

import com.google.api.services.drive.model.File;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import resource.backend.gdrive.service.GoogleDriveService;

@RestController
@RequestMapping("/api/v1/drive")
@CrossOrigin(origins = "http://localhost:3000")
public class GoogleDriveController {

    private static final Logger log = LoggerFactory.getLogger(GoogleDriveController.class);

    private final GoogleDriveService googleDriveService;

    public GoogleDriveController(GoogleDriveService googleDriveService) {
        this.googleDriveService = googleDriveService;
    }

    @GetMapping("/folders")
    public ResponseEntity<List<File>> getFolders(@RequestParam String userId) {
        log.info("Request received to fetch Google Drive folders for user: {}", userId);
        try {
            List<File> folders = googleDriveService.listFolders(userId);
            return ResponseEntity.ok(folders);
        } catch (IOException e) {
            log.error("Failed to fetch Google Drive folders for user: {}", userId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        } catch (IllegalArgumentException e) {
            log.error("Invalid UUID format for user: {}", userId, e);
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/files")
    public ResponseEntity<List<File>> getFiles(
            @RequestParam String userId,
            @RequestParam(required = false) String folderId) {
        log.info("Request received to fetch Google Drive files for user: {} in folder: {}", userId, folderId);
        try {
            List<File> files = googleDriveService.listFiles(userId, folderId);
            return ResponseEntity.ok(files);
        } catch (IOException e) {
            log.error("Failed to fetch Google Drive files for user: {} in folder: {}", userId, folderId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        } catch (IllegalArgumentException e) {
            log.error("Invalid UUID format for user: {}", userId, e);
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<File> uploadFile(
            @RequestParam String userId,
            @RequestParam("file") MultipartFile file,
            @RequestParam(required = false) String folderId) {
        log.info("Request received to upload file '{}' to Google Drive for user: {}", file.getOriginalFilename(), userId);
        try {
            File uploadedFile = googleDriveService.uploadFile(userId, file, folderId);
            return ResponseEntity.ok(uploadedFile);
        } catch (IOException e) {
            log.error("Failed to upload file to Google Drive for user: {}", userId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        } catch (IllegalArgumentException e) {
            log.error("Invalid UUID format for user: {}", userId, e);
            return ResponseEntity.badRequest().build();
        }
    }

    @DeleteMapping("/files/{fileId}")
    public ResponseEntity<Void> deleteFile(
            @RequestParam String userId,
            @PathVariable String fileId) {
        log.info("Request received to delete Google Drive file {} for user: {}", fileId, userId);
        try {
            googleDriveService.deleteFile(userId, fileId);
            return ResponseEntity.noContent().build();
        } catch (IOException e) {
            log.error("Failed to delete Google Drive file {} for user: {}", fileId, userId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        } catch (IllegalArgumentException e) {
            log.error("Invalid UUID format for user: {}", userId, e);
            return ResponseEntity.badRequest().build();
        }
    }
}