package resource.backend.folder.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import resource.backend.folder.dto.CreateFolderRequest;
import resource.backend.folder.entity.Folder;
import resource.backend.folder.repository.FolderRepository;
import resource.backend.user.entity.User;
import resource.backend.user.repository.UserRepository; // Assuming you have a UserRepository

@Service
@RequiredArgsConstructor
public class FolderService {

    private final FolderRepository folderRepository;
    private final UserRepository userRepository;
    // private final GoogleDriveClient googleDriveClient; // Your Google API integration bean

    @Transactional
    public Folder createNewFolder(CreateFolderRequest request) {
        // 1. Resolve Owner context
        User owner = userRepository.findById(request.userId())
                .orElseThrow(() -> new IllegalArgumentException("User not found in archives."));

        // 2. Resolve Parent folder context
        Folder parentFolder = folderRepository.findById(request.parentFolderId())
                .orElseThrow(() -> new IllegalArgumentException("Target parent chamber not found."));

        // 3. OUTBOUND CLOUD SYNC (Mock/Stub for Google Drive integration)
        // In production, use your Google Credentials service to get an access token for 'owner'
        // String googleDriveFolderId = googleDriveClient.createFolder(
        //     request.folderName(),
        //     parentFolder.getDriveFolderId(),
        //     owner
        // );
        String mockGoogleDriveFolderId = "mock_drive_" + java.util.UUID.randomUUID().toString().substring(0, 8);

        // 4. Build and Save the Relational record
        Folder newFolder = Folder.builder()
                .name(request.folderName())
                .driveFolderId(mockGoogleDriveFolderId) // Use the real one when Google client is live
                .parent(parentFolder)
                .owner(owner)
                .build();

        return folderRepository.save(newFolder);
    }
}