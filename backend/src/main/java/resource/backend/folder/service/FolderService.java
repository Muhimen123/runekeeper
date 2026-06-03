package resource.backend.folder.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import resource.backend.folder.dto.CreateFolderRequest;
import resource.backend.folder.entity.Folder;
import resource.backend.folder.repository.FolderRepository;
import resource.backend.user.entity.User;
import resource.backend.user.repository.UserRepository;
import resource.backend.gdrive.service.GoogleDriveService; // 🔥 Import your live Google service
import com.google.api.services.drive.model.File;
import java.io.IOException;

@Service
@RequiredArgsConstructor
public class FolderService {

    private final FolderRepository folderRepository;
    private final UserRepository userRepository;
    private final GoogleDriveService googleDriveService; // 🔥 Inject your real Google integration service

    @Transactional
    public Folder createNewFolder(CreateFolderRequest request) {
        // 1. Resolve Owner context
        User owner = userRepository.findById(request.userId())
                .orElseThrow(() -> new IllegalArgumentException("User not found in archives."));

        // 2. Resolve Parent folder context (Handle optional/root level folder creation safely)
        Folder parentFolder = null;
        String parentDriveFolderId = "root"; // Google Drive's default identifier for root level

        if (request.parentFolderId() != null) {
            parentFolder = folderRepository.findById(request.parentFolderId())
                    .orElseThrow(() -> new IllegalArgumentException("Target parent chamber not found."));
            parentDriveFolderId = parentFolder.getDriveFolderId();
        }

        // 3. LIVE OUTBOUND CLOUD SYNC
        String realGoogleDriveFolderId;
        try {
            // Call your pre-existing live API sequence using the String userId context
            File googleFolder = googleDriveService.createFolder(
                    request.userId().toString(),
                    request.folderName(),
                    parentDriveFolderId
            );

            realGoogleDriveFolderId = googleFolder.getId(); // 🔥 Capture the authoritative live ID!
        } catch (IOException e) {
            throw new RuntimeException("Failed to provision live cloud directory on Google Drive: " + e.getMessage(), e);
        }

        // 4. Build and Save the Permanent Relational Database record
        Folder newFolder = Folder.builder()
                .name(request.folderName())
                .driveFolderId(realGoogleDriveFolderId) // 🔥 Saved natively to Supabase
                .parent(parentFolder)
                .owner(owner)
                .build();

        return folderRepository.save(newFolder);
    }
}