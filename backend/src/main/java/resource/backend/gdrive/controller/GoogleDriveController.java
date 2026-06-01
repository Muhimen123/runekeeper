package resource.backend.gdrive.controller; // 🌟 FIXED: Kept in the core gdrive package folder

import java.io.IOException;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

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
}