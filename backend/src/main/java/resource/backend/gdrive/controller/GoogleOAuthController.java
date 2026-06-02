package resource.backend.gdrive.controller;

// 1. Java Standard Library Imports
import java.io.IOException;
import jakarta.servlet.http.HttpServletResponse;

// 2. Spring Framework Imports
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

// 3. Lombok Annotation Import
//import lombok.RequiredArgsConstructor;

// 4. Google API Client Imports
import com.google.api.client.auth.oauth2.TokenResponse;
import com.google.api.client.googleapis.auth.oauth2.GoogleAuthorizationCodeTokenRequest;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;

// 5. Your Database Repository Import
import resource.backend.gdrive.entity.UserToken;
import resource.backend.gdrive.repository.UserTokenRepository;

@RestController
@RequestMapping("/oauth")
//@RequiredArgsConstructor
public class GoogleOAuthController {

    @Value("${google.client-id}")
    private String clientId;

    @Value("${google.client-secret}")
    private String clientSecret;

    @Value("${google.redirect-uri}")
    private String redirectUri;

    private final UserTokenRepository tokenRepository; // Your database repo to save tokens

    public GoogleOAuthController(UserTokenRepository tokenRepository) {
        this.tokenRepository = tokenRepository;
    }

    // 1. Redirect user to Google Auth inside GoogleOAuthController.java
    @GetMapping("/connect")
    public void connectGoogleDrive(@RequestParam String userId, HttpServletResponse response) throws IOException {

        String encodedRedirectUri = java.net.URLEncoder.encode(redirectUri, java.nio.charset.StandardCharsets.UTF_8);

        String googleAuthUrl = "https://accounts.google.com/o/oauth2/v2/auth" +
                "?client_id=" + clientId +
                "&redirect_uri=" + encodedRedirectUri +
                "&response_type=code" +
                "&scope=https://www.googleapis.com/auth/drive" +
                "&access_type=offline" +
                "&prompt=consent" +
                "&state=" + userId;

        response.sendRedirect(googleAuthUrl);
    }

    // 2. Callback endpoint where Google sends the authorization code
    @GetMapping("/callback/google")
    public void googleCallback(@RequestParam String code, @RequestParam String state, HttpServletResponse response) throws IOException {
        String userIdStr = state; // The state variable holds your application's userId string

        // Exchange code for tokens using Google API libraries
        TokenResponse tokenResponse = new GoogleAuthorizationCodeTokenRequest(
                new NetHttpTransport(),
                GsonFactory.getDefaultInstance(),
                "https://oauth2.googleapis.com/token",
                clientId,
                clientSecret,
                code,
                redirectUri
        ).execute();

        String accessToken = tokenResponse.getAccessToken();
        String refreshToken = tokenResponse.getRefreshToken();

        // 1. Convert the state userId string into a java.util.UUID to match your database schema
        java.util.UUID userId = java.util.UUID.fromString(userIdStr);

        // 2. Calculate when the token expires (typically 3600 seconds from now)
        java.time.OffsetDateTime expiryTime = java.time.OffsetDateTime.now()
                .plusSeconds(tokenResponse.getExpiresInSeconds());

        // 3. Build the entity object using Lombok's Builder pattern
        UserToken tokenEntity = UserToken.builder()
                .userId(userId)
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .expiryTime(expiryTime)
                .build();

        // 4. Save to DB. If userId already exists, JPA updates it. If not, it inserts it.
        tokenRepository.save(tokenEntity);

        // Redirect user back to Next.js dashboard
        response.sendRedirect(redirectUri);
    }
}