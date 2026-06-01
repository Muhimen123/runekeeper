package resource.backend.gdrive.service;

// 1. Java Standard Library Imports
import java.io.IOException;
import java.util.List;
import java.util.UUID;

// 2. Spring Framework Imports
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

// 3. Lombok Annotation Import
import lombok.RequiredArgsConstructor;

// 4. Google API Client Imports
import com.google.api.client.googleapis.auth.oauth2.GoogleCredential;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import com.google.api.services.drive.Drive;
import com.google.api.services.drive.model.File;
import resource.backend.gdrive.entity.UserToken;
import resource.backend.gdrive.repository.UserTokenRepository;

@Service
@RequiredArgsConstructor
public class GoogleDriveService {

    // No external imports needed if UserToken and UserTokenRepository
    // are in this exact same 'resource.backend.gdrive' folder package!
    private final UserTokenRepository tokenRepository;

    @Value("${google.client-id}") private String clientId;
    @Value("${google.client-secret}") private String clientSecret;

    public Drive getDriveService(String userIdStr) throws IOException {
        // 1. Convert incoming String ID from Next.js request into a clean java.util.UUID
        UUID userId = UUID.fromString(userIdStr);

        // 2. Use the standard JPA built-in .findById() method instead of findByUserId
        UserToken tokens = tokenRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Google Drive not connected for user: " + userIdStr));

        // Set up the credential wrapper that automatically uses the refresh_token if access_token is expired
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

    public List<File> listFiles(String userId) throws IOException {
        Drive drive = getDriveService(userId);
        return drive.files().list()
                .setPageSize(10)
                .setFields("nextPageToken, files(id, name, mimeType)")
                .execute()
                .getFiles();
    }
}