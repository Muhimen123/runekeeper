package resource.backend.common;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;
import java.util.*;

@RestController
@RequestMapping("/auth")
@CrossOrigin(origins = "*") // ফ্রন্টএন্ড থেকে রিকোয়েস্ট আসার অনুমতি
public class SupabaseAuthController {

    @Value("${supabase.url}")
    private String supabaseUrl;

    @Value("${supabase.key}")
    private String supabaseKey;

    // ==========================================
    // ১. সিম্পল সাইন-আপ (SIGNUP)
    // ==========================================
    @PostMapping("/signup")
    public ResponseEntity<String> signup(@RequestBody Map<String, String> req) {
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
            return rest.postForEntity(url, entity, String.class);

        } catch (Exception e) {
            return ResponseEntity.status(500).body("Signup failed: " + e.getMessage());
        }
    }

    // ==========================================
    // ২. সিম্পল লগইন (LOGIN)
    // ==========================================
    @PostMapping("/login")
    public ResponseEntity<String> login(@RequestBody Map<String, String> req) {
        String email = req.get("email");
        String password = req.get("password");

        try {
            RestTemplate rest = new RestTemplate();
            // সুপাবেসের অফিশিয়াল লগইন এন্ডপয়েন্ট হচ্ছে /token?grant_type=password
            String url = supabaseUrl + "/auth/v1/token?grant_type=password";

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("apikey", supabaseKey);
            headers.set("Authorization", "Bearer " + supabaseKey);

            Map<String, String> body = new HashMap<>();
            body.put("email", email);
            body.put("password", password);

            HttpEntity<Map<String, String>> entity = new HttpEntity<>(body, headers);
            return rest.postForEntity(url, entity, String.class);

        } catch (Exception e) {
            return ResponseEntity.status(401).body("Invalid email or password!");
        }
    }
}