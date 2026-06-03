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

// 3. Google API Client Imports
import com.google.api.client.auth.oauth2.TokenResponse;
import com.google.api.client.googleapis.auth.oauth2.GoogleAuthorizationCodeTokenRequest;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;

// 4. Your Database Repository and Entity Imports
import resource.backend.user.entity.User;
import resource.backend.gdrive.entity.UserToken;
import resource.backend.user.repository.UserRepository;
import resource.backend.gdrive.repository.UserTokenRepository;

@RestController
@RequestMapping("/oauth")
public class GoogleOAuthController {

    @Value("${google.client-id}")
    private String clientId;

    @Value("${google.client-secret}")
    private String clientSecret;

    @Value("${google.redirect-uri}")
    private String redirectUri;

    private final UserTokenRepository tokenRepository;
    private final UserRepository userRepository; // Added to resolve FK race condition

    // Constructor injection for both required repositories
    public GoogleOAuthController(UserTokenRepository tokenRepository, UserRepository userRepository) {
        this.tokenRepository = tokenRepository;
        this.userRepository = userRepository;
    }

    // 1. Redirect user to Google Auth
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

        // Convert the state userId string into a java.util.UUID to match your database schema
        java.util.UUID userId = java.util.UUID.fromString(userIdStr);

        // =====================================================================
        // 🔥 JIT PROVISIONING STEP: Resolves PostgreSQL foreign key constraint
        // =====================================================================
        if (userRepository.findByAuthId(userId).isEmpty()) {
            System.out.println("[OAuth Sync] User record completely missing. Safe provision execution triggered for: " + userId);

            String fallbackName = "user_" + userIdStr.substring(0, 8);

            User fallbackUser = new User();
            // Assign the incoming UUID to BOTH identifiers to ensure database consistency
            fallbackUser.setId(userId);     // Sets the primary key inherited from BaseEntity
            fallbackUser.setAuthId(userId); // Sets your application unique auth column link

            // Populate non-nullable database constraints
            fallbackUser.setUsername(fallbackName);
            fallbackUser.setDisplayName(fallbackName);
            fallbackUser.setRewardPoints(0);

            userRepository.save(fallbackUser);
        }
        // =====================================================================

        // Calculate when the token expires (typically 3600 seconds from now)
        java.time.OffsetDateTime expiryTime = java.time.OffsetDateTime.now()
                .plusSeconds(tokenResponse.getExpiresInSeconds());

        // Build the entity object using Lombok's Builder pattern
        UserToken tokenEntity = UserToken.builder()
                .userId(userId)
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .expiryTime(expiryTime)
                .build();

        // Save to DB. The FK constraint is now guaranteed to pass.
        tokenRepository.save(tokenEntity);

        // Redirect user back to Next.js application dashboard
        response.sendRedirect("http://localhost:3000/homepage");
    }
}