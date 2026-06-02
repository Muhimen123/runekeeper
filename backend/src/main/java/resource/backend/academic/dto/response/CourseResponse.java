package resource.backend.academic.dto.response;

import java.time.LocalDateTime;

import java.util.UUID;

public record CourseResponse(

                UUID id,

                String name,

                UUID semesterId,

                UUID rootFolderId,

                LocalDateTime createdAt,

                LocalDateTime updatedAt

) {

}