package resource.backend.analysis.service;

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import tools.jackson.databind.node.ArrayNode;
import tools.jackson.databind.node.ObjectNode;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import resource.backend.analysis.dto.SummaryResponse;

import java.util.Base64;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class GeminiAnalysisService {

    @Value("${gemini.api-key}")
    private String apiKey;

    @Value("${gemini.api-url}")
    private String apiUrl;

    private final ObjectMapper objectMapper = new ObjectMapper();

    public SummaryResponse analyzeDriveLink(String driveUrl) {
        // 1. Extract file ID and check if it's a Google Doc
        String fileId = extractFileId(driveUrl);
        boolean isGoogleDoc = driveUrl.contains("docs.google.com/document");

        // 2. Download the PDF bytes
        byte[] pdfBytes = downloadDriveFile(fileId, isGoogleDoc);

        // 3. Call Gemini with inline data
        return callGemini(pdfBytes);
    }

    private String extractFileId(String driveUrl) {
        Pattern pattern = Pattern.compile("/d/([^/]+)");
        Matcher matcher = pattern.matcher(driveUrl);
        if (matcher.find()) {
            return matcher.group(1);
        }
        if (driveUrl.contains("id=")) {
            int start = driveUrl.indexOf("id=") + 3;
            int end = driveUrl.indexOf("&", start);
            if (end == -1) {
                return driveUrl.substring(start);
            }
            return driveUrl.substring(start, end);
        }
        throw new IllegalArgumentException("Invalid Google Drive URL provided: " + driveUrl);
    }

    private byte[] downloadDriveFile(String fileId, boolean isGoogleDoc) {
        String directUrl;
        if (isGoogleDoc) {
            directUrl = String.format("https://docs.google.com/document/d/%s/export?format=pdf", fileId);
        } else {
            directUrl = String.format("https://drive.google.com/uc?export=download&id=%s", fileId);
        }

        try {
            java.net.http.HttpClient client = java.net.http.HttpClient.newBuilder()
                    .followRedirects(java.net.http.HttpClient.Redirect.ALWAYS)
                    .build();

            java.net.http.HttpRequest request = java.net.http.HttpRequest.newBuilder()
                    .uri(java.net.URI.create(directUrl))
                    .GET()
                    .build();

            java.net.http.HttpResponse<byte[]> response = client.send(
                    request,
                    java.net.http.HttpResponse.BodyHandlers.ofByteArray()
            );

            if (response.statusCode() != 200) {
                throw new RuntimeException("HTTP status " + response.statusCode());
            }

            byte[] responseBytes = response.body();
            if (responseBytes == null || responseBytes.length == 0) {
                throw new RuntimeException("Downloaded file is empty");
            }
            return responseBytes;
        } catch (Exception e) {
            throw new RuntimeException("Failed to download file from Google Drive. Error: " + e.getMessage(), e);
        }
    }

    private SummaryResponse callGemini(byte[] pdfBytes) {
        String uri = String.format("%s/models/gemini-2.5-flash:generateContent?key=%s", apiUrl, apiKey);

        try {
            // Build the JSON payload programmatically
            ObjectNode payload = objectMapper.createObjectNode();

            // Contents array
            ArrayNode contents = objectMapper.createArrayNode();
            ObjectNode content = objectMapper.createObjectNode();
            ArrayNode parts = objectMapper.createArrayNode();

            // Part 1: Prompt
            ObjectNode textPart = objectMapper.createObjectNode();
            textPart.put("text", "Analyze the provided document.\n1. Give a concise summary.\n2. Generate LaTeX code representing the summary.\nReturn strictly in JSON format.");
            parts.add(textPart);

            // Part 2: Inline PDF Base64 Data
            ObjectNode pdfPart = objectMapper.createObjectNode();
            ObjectNode inlineData = objectMapper.createObjectNode();
            inlineData.put("mimeType", "application/pdf");
            inlineData.put("data", Base64.getEncoder().encodeToString(pdfBytes));
            pdfPart.set("inlineData", inlineData);
            parts.add(pdfPart);

            content.set("parts", parts);
            contents.add(content);
            payload.set("contents", contents);

            // Generation Config with Response Schema
            ObjectNode genConfig = objectMapper.createObjectNode();
            genConfig.put("responseMimeType", "application/json");
            genConfig.put("temperature", 0.2);

            ObjectNode responseSchema = objectMapper.createObjectNode();
            responseSchema.put("type", "OBJECT");

            ObjectNode properties = objectMapper.createObjectNode();
            
            ObjectNode plainSummaryProp = objectMapper.createObjectNode();
            plainSummaryProp.put("type", "STRING");
            properties.set("plain_summary", plainSummaryProp);

            ObjectNode latexCodeProp = objectMapper.createObjectNode();
            latexCodeProp.put("type", "STRING");
            properties.set("latex_code", latexCodeProp);

            responseSchema.set("properties", properties);

            ArrayNode required = objectMapper.createArrayNode();
            required.add("plain_summary");
            required.add("latex_code");
            responseSchema.set("required", required);

            genConfig.set("responseSchema", responseSchema);
            payload.set("generationConfig", genConfig);

            // Invoke API via RestClient
            RestClient restClient = RestClient.create();
            String responseBody = restClient.post()
                    .uri(uri)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(payload)
                    .retrieve()
                    .body(String.class);

            // Parse response
            JsonNode rootNode = objectMapper.readTree(responseBody);
            JsonNode candidates = rootNode.path("candidates");
            if (candidates.isArray() && !candidates.isEmpty()) {
                JsonNode partsNode = candidates.get(0).path("content").path("parts");
                if (partsNode.isArray() && !partsNode.isEmpty()) {
                    String resultText = partsNode.get(0).path("text").asText();
                    return objectMapper.readValue(resultText, SummaryResponse.class);
                }
            }
            throw new RuntimeException("Unexpected response format from Gemini: " + responseBody);

        } catch (Exception e) {
            throw new RuntimeException("Failed to analyze document with Gemini: " + e.getMessage(), e);
        }
    }
}
