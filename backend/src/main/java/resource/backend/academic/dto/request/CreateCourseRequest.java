package resource.backend.academic.dto.request;

import java.util.UUID;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record CreateCourseRequest(

        @NotBlank(message = "Course name is required") String name,
        @NotNull(message = "Semester ID is required")
        UUID semesterId,
        UUID rootFolderId

) {
}