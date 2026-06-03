package resource.backend.gdrive.service;

// 1. Java Standard Library Imports
import java.io.IOException;
import java.util.List;
import java.util.UUID;

// 2. Spring Framework Imports
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

// 3. Google API Client Imports
import com.google.api.client.googleapis.auth.oauth2.GoogleCredential;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import com.google.api.client.http.InputStreamContent;
import com.google.api.services.drive.Drive;
import com.google.api.services.drive.model.File;

// 4. Application Imports
import resource.backend.gdrive.entity.UserToken;
import resource.backend.gdrive.repository.UserTokenRepository;
import org.springframework.web.multipart.MultipartFile;

@Service
public class GoogleDriveService {

    private final UserTokenRepository tokenRepository;

    // Cleaned up unused folderRepository and userRepository dependencies
    public GoogleDriveService(UserTokenRepository tokenRepository) {
        this.tokenRepository = tokenRepository;
    }

    @Value("${google.client-id}") private String clientId;
    @Value("${google.client-secret}") private String clientSecret;

    public Drive getDriveService(String userIdStr) throws IOException {
        UUID userId = UUID.fromString(userIdStr);

        UserToken tokens = tokenRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Google Drive not connected for user: " + userIdStr));

        @SuppressWarnings("deprecation")
        GoogleCredential credential = new GoogleCredential.Builder()
                .setTransport(new NetHttpTransport())
                .setJsonFactory(GsonFactory.getDefaultInstance())
                .setClientSecrets(clientId, clientSecret)
                .build()
                .setAccessToken(tokens.getAccessToken())
                .setRefreshToken(tokens.getRefreshToken());

        return new Drive.Builder(new NetHttpTransport(), GsonFactory.getDefaultInstance(), credential)
                .setApplicationName("YourWebAppName")
                .build();
    }

    public List<File> listFiles(String userId, String folderId) throws IOException {
        Drive drive = getDriveService(userId);
        String parentId = (folderId != null && !folderId.trim().isEmpty() && !folderId.equalsIgnoreCase("root"))
                ? folderId
                : "root";

        return drive.files().list()
                .setQ("'" + parentId + "' in parents and trashed = false and mimeType != 'application/vnd.google-apps.folder'")
                .setPageSize(50)
                .setFields("nextPageToken, files(id, name, mimeType, webViewLink, size)")
                .execute()
                .getFiles();
    }

    public List<File> listFolders(String userId, String parentFolderId) throws IOException {
        Drive drive = getDriveService(userId);
        String parent = (parentFolderId != null && !parentFolderId.trim().isEmpty() && !parentFolderId.equalsIgnoreCase("root"))
                ? parentFolderId
                : "root";
        return drive.files().list()
                .setQ("'" + parent + "' in parents and trashed = false and mimeType = 'application/vnd.google-apps.folder'")
                .setPageSize(50)
                .setFields("nextPageToken, files(id, name, mimeType)")
                .execute()
                .getFiles();
    }

    public File uploadFile(String userId, MultipartFile multipartFile, String parentFolderId) throws IOException {
        Drive drive = getDriveService(userId);

        File fileMetadata = new File();
        fileMetadata.setName(multipartFile.getOriginalFilename());
        if (parentFolderId != null && !parentFolderId.trim().isEmpty() && !parentFolderId.equalsIgnoreCase("root")) {
            fileMetadata.setParents(List.of(parentFolderId));
        }

        InputStreamContent mediaContent = new InputStreamContent(
                multipartFile.getContentType(),
                multipartFile.getInputStream()
        );

        return drive.files().create(fileMetadata, mediaContent)
                .setFields("id, name, mimeType, webViewLink, webContentLink")
                .execute();
    }

    public void deleteFile(String userId, String fileId) throws IOException {
        Drive drive = getDriveService(userId);
        drive.files().delete(fileId).execute();
    }

    // 🔥 CLEANED: Strictly focused on Google Drive execution API logic.
    // Data mapping and Supabase persistence is safely handled by FolderService now.
    public File createFolder(String userIdStr, String folderName, String parentFolderId) throws IOException {
        Drive drive = getDriveService(userIdStr);

        File fileMetadata = new File();
        fileMetadata.setName(folderName);
        fileMetadata.setMimeType("application/vnd.google-apps.folder");

        if (parentFolderId != null && !parentFolderId.trim().isEmpty() && !parentFolderId.equalsIgnoreCase("root")) {
            fileMetadata.setParents(List.of(parentFolderId));
        }

        return drive.files().create(fileMetadata)
                .setFields("id, name, mimeType, webViewLink")
                .execute();
    }
}