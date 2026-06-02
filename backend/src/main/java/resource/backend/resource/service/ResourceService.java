package resource.backend.resource.service;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import resource.backend.gdrive.service.GoogleDriveService;
import resource.backend.folder.entity.Folder;
import resource.backend.folder.repository.FolderRepository;
import resource.backend.resource.dto.ResourceResponse;
import resource.backend.resource.entity.Resource;
import resource.backend.resource.entity.ResourceType;
import resource.backend.resource.repository.ResourceRepository;
import resource.backend.reward.entity.RewardAction;
import resource.backend.reward.entity.RewardEvent;
import resource.backend.reward.repository.RewardEventRepository;
import resource.backend.user.entity.User;
import resource.backend.user.repository.UserRepository;

@Service
@RequiredArgsConstructor
@Slf4j
public class ResourceService {

    private final ResourceRepository resourceRepository;
    private final GoogleDriveService googleDriveService;
    private final UserRepository userRepository;
    private final FolderRepository folderRepository;
    private final RewardEventRepository rewardEventRepository;

    @Transactional
    public List<ResourceResponse> uploadResources(String userIdStr, MultipartFile[] files, String folderIdStr) throws IOException {
        log.info("Starting resource upload process for user: {}, local folder UUID: {}, files count: {}", userIdStr, folderIdStr, files.length);

        // 1. Resolve User Context
        UUID userId = UUID.fromString(userIdStr);
        User owner = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found with ID: " + userIdStr));

        // 2. FIXED: Local Database Folder Lookup Strategy
        // We now look up by local primary key UUID since the Next.js Course Viewer tracks local folder IDs.
        Folder folder = null;
        if (folderIdStr != null && !folderIdStr.trim().isEmpty() && !folderIdStr.equalsIgnoreCase("root")) {
            try {
                UUID localFolderUuid = UUID.fromString(folderIdStr);
                folder = folderRepository.findById(localFolderUuid).orElse(null);
                if (folder == null) {
                    log.warn("Folder with local database UUID {} not found in archives. Uploading with unassociated path.", folderIdStr);
                }
            } catch (IllegalArgumentException e) {
                // Fallback boundary check: if it is not a valid UUID string, try looking up by Google Drive folder ID
                log.info("folderIdStr is not a local UUID format. Attempting fallback lookup via drive_folder_id for: {}", folderIdStr);
                folder = folderRepository.findByDriveFolderId(folderIdStr).orElse(null);
            }
        }

        // 3. Resolve parent drive target context to present to Google Drive Client Wrapper
        // If local folder tracking exists, extract its real drive chain identifier string.
        String targetDriveFolderId = (folder != null) ? folder.getDriveFolderId() : folderIdStr;

        List<ResourceResponse> responses = new ArrayList<>();

        for (MultipartFile multipartFile : files) {
            if (multipartFile.isEmpty()) {
                continue;
            }

            // 4. Upload raw binary file to physical Google Drive chamber
            log.info("Uploading file to Google Drive: {}", multipartFile.getOriginalFilename());
            com.google.api.services.drive.model.File driveFile = googleDriveService.uploadFile(userIdStr, multipartFile, targetDriveFolderId);

            // 5. Categorize resource types cleanly
            ResourceType resourceType = mapMimeTypeToResourceType(driveFile.getMimeType());

            // 6. Persist structured metadata into local PostgreSQL tables
            Resource resource = new Resource();
            resource.setName(driveFile.getName());
            resource.setDescription(null);
            resource.setMimeType(driveFile.getMimeType());
            resource.setOwner(owner);
            resource.setFolder(folder); // Safely sets the correct relational mapping via local folder entity reference
            resource.setResourceType(resourceType);
            resource.setDriveFileId(driveFile.getId());
            resource.setDriveUrl(driveFile.getWebViewLink() != null ? driveFile.getWebViewLink() : "");
            resource.setLikeCount(0);
            resource.setViewCount(0);

            Resource savedResource = resourceRepository.save(resource);
            log.info("Saved resource to database with ID: {}", savedResource.getId());

            // 7. Gamification System execution
            RewardEvent rewardEvent = new RewardEvent();
            rewardEvent.setUser(owner);
            rewardEvent.setAction(RewardAction.RESOURCE_UPLOAD);
            rewardEvent.setPoints(50);
            rewardEvent.setRewardedResource(savedResource);

            rewardEventRepository.save(rewardEvent);
            log.info("Awarded 50 points to user {} for uploading resource {}", userId, savedResource.getId());

            // 8. Output Response Array Mapping
            responses.add(new ResourceResponse(
                    savedResource.getId(),
                    savedResource.getName(),
                    savedResource.getDescription(),
                    savedResource.getMimeType(),
                    owner.getId(),
                    savedResource.getFolder() != null ? savedResource.getFolder().getId() : null,
                    savedResource.getResourceType(),
                    savedResource.getDriveFileId(),
                    savedResource.getDriveUrl(),
                    savedResource.getLikeCount() != null ? savedResource.getLikeCount() : 0,
                    savedResource.getViewCount() != null ? savedResource.getViewCount() : 0
            ));
        }

        return responses;
    }

    private ResourceType mapMimeTypeToResourceType(String mimeType) {
        if (mimeType == null) {
            return ResourceType.OTHER;
        }
        String lowerMime = mimeType.toLowerCase();
        if (lowerMime.contains("pdf") || lowerMime.contains("word") || lowerMime.contains("document") ||
                lowerMime.contains("text/plain") || lowerMime.contains("sheet") || lowerMime.contains("presentation")) {
            return ResourceType.DOCUMENT;
        } else if (lowerMime.contains("video")) {
            return ResourceType.VIDEO;
        } else if (lowerMime.contains("image")) {
            return ResourceType.IMAGE;
        } else if (lowerMime.contains("audio")) {
            return ResourceType.AUDIO;
        } else {
            return ResourceType.OTHER;
        }
    }
}