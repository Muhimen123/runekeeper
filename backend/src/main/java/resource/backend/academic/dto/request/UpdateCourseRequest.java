package resource.backend.academic.dto.request;

import java.util.UUID;

public record UpdateCourseRequest(

        String name,

        UUID rootFolderId

) {
}