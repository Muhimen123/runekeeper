package resource.backend.analysis.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SummaryResponse {

    @JsonProperty("plain_summary")
    private String plainSummary;

    @JsonProperty("latex_code")
    private String latexCode;
}
