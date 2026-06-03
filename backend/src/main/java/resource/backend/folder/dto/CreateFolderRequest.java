package resource.backend.folder.dto;

import java.util.UUID;

public record CreateFolderRequest(
        String folderName,
        UUID parentFolderId,
        UUID userId
) {}