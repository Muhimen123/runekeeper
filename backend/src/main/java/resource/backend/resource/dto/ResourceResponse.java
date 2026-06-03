package resource.backend.resource.dto;

import java.util.UUID;
import resource.backend.resource.entity.ResourceType;

public record ResourceResponse(
        UUID id,
        String name,
        String description,
        String mimeType,
        UUID ownerId,
        UUID folderId,
        ResourceType resourceType,
        String driveFileId,
        String driveUrl,
        Integer likeCount,
        Integer viewCount
) {}
