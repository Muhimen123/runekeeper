package resource.backend.academic.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import resource.backend.academic.entity.Semester;
import resource.backend.academic.repository.SemesterRepository;
import resource.backend.folder.entity.Folder;
import resource.backend.folder.repository.FolderRepository;
import resource.backend.gdrive.repository.UserTokenRepository;
import resource.backend.gdrive.service.GoogleDriveService;
import resource.backend.user.entity.User;
import resource.backend.user.repository.UserRepository;

import java.io.IOException;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class RoomService {

    private final SemesterRepository semesterRepository;
    private final UserRepository userRepository;
    private final FolderRepository folderRepository;
    private final UserTokenRepository tokenRepository;
    private final GoogleDriveService googleDriveService;

    @Transactional
    public Semester createRoom(String name, UUID ownerId) {
        log.info("Creating room/semester: {} for owner: {}", name, ownerId);

        User owner = userRepository.findById(ownerId)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + ownerId));

        Semester semester = new Semester();
        semester.setName(name);
        semester.setOwner(owner);
        semester = semesterRepository.save(semester);

        // Check if user has connected their Google Drive
        if (tokenRepository.existsById(ownerId)) {
            try {
                log.info("User {} is connected to Google Drive. Creating corresponding folder: {}", ownerId, name);
                com.google.api.services.drive.model.File driveFolder = 
                        googleDriveService.createFolder(ownerId.toString(), name, null);
                
                Folder folder = new Folder();
                folder.setName(name);
                folder.setDriveFolderId(driveFolder.getId());
                folder.setOwner(owner);
                folder.setParent(null);
                
                folderRepository.save(folder);
                log.info("Saved folder metadata to DB for drive folder ID: {}", driveFolder.getId());
            } catch (IOException e) {
                log.error("Failed to create Google Drive folder for user {} during room creation", ownerId, e);
                throw new RuntimeException("Failed to create folder in Google Drive: " + e.getMessage(), e);
            }
        } else {
            log.warn("User {} is not connected to Google Drive. Skipping folder creation.", ownerId);
        }

        return semester;
    }

    public List<Semester> getRoomsByOwner(UUID ownerId) {
        return semesterRepository.findByOwnerId(ownerId);
    }
}
