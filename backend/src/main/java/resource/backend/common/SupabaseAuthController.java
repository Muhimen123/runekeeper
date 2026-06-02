package resource.backend.common;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.RestTemplate;
import java.util.*;

@RestController
@RequestMapping("/auth")
@CrossOrigin(origins = "*")
public class SupabaseAuthController {

    @Value("${supabase.url}")
    private String supabaseUrl;

    @Value("${supabase.key}")
    private String supabaseKey;

    @PostMapping("/signup")
    public ResponseEntity<?> signup(@RequestBody Map<String, String> req) {
        String email = req.get("email");
        String password = req.get("password");

        try {
            RestTemplate rest = new RestTemplate();
            String url = supabaseUrl + "/auth/v1/signup";

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("apikey", supabaseKey);
            headers.set("Authorization", "Bearer " + supabaseKey);

            Map<String, String> body = new HashMap<>();
            body.put("email", email);
            body.put("password", password);

            HttpEntity<Map<String, String>> entity = new HttpEntity<>(body, headers);
            ResponseEntity<String> supabaseResponse = rest.postForEntity(url, entity, String.class);

            // ADD THESE LOGS
            System.out.println("Supabase status: " + supabaseResponse.getStatusCode());
            System.out.println("Supabase body: [" + supabaseResponse.getBody() + "]");
            System.out.println("Supabase headers: " + supabaseResponse.getHeaders());

            String responseBody = supabaseResponse.getBody();
            if (responseBody == null || responseBody.isBlank()) {
                Map<String, String> fallback = new HashMap<>();
                fallback.put("message", "Signup successful. Please check your email to confirm your account.");
                return ResponseEntity.ok()
                        .contentType(MediaType.APPLICATION_JSON)
                        .body(fallback);
            }

            return ResponseEntity.ok()
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(responseBody);

        } catch (HttpStatusCodeException e) {
            System.out.println("Supabase error status: " + e.getStatusCode());
            System.out.println("Supabase error body: [" + e.getResponseBodyAsString() + "]");

            String errorBody = e.getResponseBodyAsString();

            // Supabase sometimes returns empty body on 401 — always send valid JSON
            if (errorBody.isBlank()) {
                errorBody = "{\"message\": \"Unauthorized. Check your Supabase project settings.\"}";
            }

            return ResponseEntity.status(e.getStatusCode())
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(errorBody);
        } catch (Exception e) {
            System.out.println("Exception: " + e.getClass().getName() + " - " + e.getMessage());
            Map<String, String> errorMap = new HashMap<>();
            errorMap.put("message", "Signup failed: " + e.getMessage());
            return ResponseEntity.status(500).body(errorMap);
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> req) {
        String email = req.get("email");
        String password = req.get("password");

        try {
            RestTemplate rest = new RestTemplate();
            String url = supabaseUrl + "/auth/v1/token?grant_type=password";

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("apikey", supabaseKey);
            headers.set("Authorization", "Bearer " + supabaseKey);

            Map<String, String> body = new HashMap<>();
            body.put("email", email);
            body.put("password", password);

            HttpEntity<Map<String, String>> entity = new HttpEntity<>(body, headers);
            ResponseEntity<String> supabaseResponse = rest.postForEntity(url, entity, String.class);

            String responseBody = supabaseResponse.getBody();
            if (responseBody == null || responseBody.isBlank()) {
                Map<String, String> errorMap = new HashMap<>();
                errorMap.put("message", "Login failed: empty response from auth server.");
                return ResponseEntity.status(500)
                        .contentType(MediaType.APPLICATION_JSON)
                        .body(errorMap);
            }

            return ResponseEntity.ok()
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(responseBody);

        } catch (HttpStatusCodeException e) {
            return ResponseEntity.status(e.getStatusCode())
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(e.getResponseBodyAsString());
        } catch (Exception e) {
            Map<String, String> errorMap = new HashMap<>();
            errorMap.put("message", "Invalid email or password!");
            return ResponseEntity.status(401).body(errorMap);
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(@RequestHeader(value = "Authorization", required = false) String authHeader) {
        // 1. Ensure the user's bearer token is actually passed down by the frontend
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            Map<String, String> errorMap = new HashMap<>();
            errorMap.put("message", "Missing or invalid authorization session token.");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(errorMap);
        }

        try {
            RestTemplate rest = new RestTemplate();
            String url = supabaseUrl + "/auth/v1/logout";

            // 2. Forward both project api-keys and the active user session token
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("apikey", supabaseKey);
            headers.set("Authorization", authHeader); // 🔥 Passes "Bearer user_token_here"

            HttpEntity<Void> entity = new HttpEntity<>(headers);

            // Supabase returns a 204 No Content status upon a successful session termination
            rest.postForEntity(url, entity, String.class);

            Map<String, String> successMap = new HashMap<>();
            successMap.put("message", "Session cleared from archives successfully.");
            return ResponseEntity.ok()
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(successMap);

        } catch (HttpStatusCodeException e) {
            System.out.println("Supabase logout error status: " + e.getStatusCode());
            return ResponseEntity.status(e.getStatusCode())
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(e.getResponseBodyAsString());
        } catch (Exception e) {
            Map<String, String> errorMap = new HashMap<>();
            errorMap.put("message", "Logout request failed: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(errorMap);
        }
    }
}