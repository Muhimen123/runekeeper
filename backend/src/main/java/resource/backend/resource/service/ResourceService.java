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
        log.info("Starting resource upload process for user: {}, folder: {}, files count: {}", userIdStr, folderIdStr, files.length);

        UUID userId = UUID.fromString(userIdStr);
        User owner = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found with ID: " + userIdStr));

        Folder folder = null;
        if (folderIdStr != null && !folderIdStr.trim().isEmpty() && !folderIdStr.equalsIgnoreCase("root")) {
            folder = folderRepository.findByDriveFolderId(folderIdStr).orElse(null);
            if (folder == null) {
                log.warn("Folder with drive ID {} not found in database. The files will be uploaded without local folder association.", folderIdStr);
            }
        }

        List<ResourceResponse> responses = new ArrayList<>();

        for (MultipartFile multipartFile : files) {
            if (multipartFile.isEmpty()) {
                continue;
            }

            // 1. Upload the file to Google Drive
            log.info("Uploading file to Google Drive: {}", multipartFile.getOriginalFilename());
            com.google.api.services.drive.model.File driveFile = googleDriveService.uploadFile(userIdStr, multipartFile, folderIdStr);

            // 2. Map mimeType to ResourceType
            ResourceType resourceType = mapMimeTypeToResourceType(driveFile.getMimeType());

            // 3. Save Resource metadata in Database
            Resource resource = new Resource();
            resource.setName(driveFile.getName());
            resource.setDescription(null);
            resource.setMimeType(driveFile.getMimeType());
            resource.setOwner(owner);
            resource.setFolder(folder);
            resource.setResourceType(resourceType);
            resource.setDriveFileId(driveFile.getId());
            resource.setDriveUrl(driveFile.getWebViewLink() != null ? driveFile.getWebViewLink() : "");
            resource.setLikeCount(0);
            resource.setViewCount(0);

            Resource savedResource = resourceRepository.save(resource);
            log.info("Saved resource to database with ID: {}", savedResource.getId());

            // 4. Award 50 points to the user for uploading the file
            RewardEvent rewardEvent = new RewardEvent();
            rewardEvent.setUser(owner);
            rewardEvent.setAction(RewardAction.RESOURCE_UPLOAD);
            rewardEvent.setPoints(50);
            rewardEvent.setRewardedResource(savedResource);

            rewardEventRepository.save(rewardEvent);
            log.info("Awarded 50 points to user {} for uploading resource {}", userId, savedResource.getId());

            // 5. Build response record using strict defensive checks to prevent NullPointerExceptions
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
