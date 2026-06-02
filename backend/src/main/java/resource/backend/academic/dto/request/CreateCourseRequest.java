package resource.backend.academic.dto.request;

import java.util.UUID;
import jakarta.validation.constraints.NotBlank;

public record CreateCourseRequest(

        @NotBlank(message = "Course name is required") String name,

        UUID rootFolderId

) {
}