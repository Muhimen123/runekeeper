package resource.backend.analysis.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import resource.backend.analysis.dto.SummaryResponse;
import resource.backend.analysis.service.GeminiAnalysisService;

@RestController
@RequestMapping("/analysis")
@RequiredArgsConstructor
public class AnalysisController {

    private final GeminiAnalysisService geminiAnalysisService;

    @GetMapping("/sample")
    public ResponseEntity<SummaryResponse> analyzeSample() {
        String sampleDriveLink = "https://docs.google.com/document/d/1dPfYp_xcuPknRFiSsp9k6gpjG5XDriquFIN8Z3vhU5U/edit?tab=t.0";
        SummaryResponse response = geminiAnalysisService.analyzeDriveLink(sampleDriveLink);
        return ResponseEntity.ok(response);
    }
}
