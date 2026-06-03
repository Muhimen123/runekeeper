package resource.backend.resource.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.Type;
import resource.backend.common.entity.BaseEntity;
import resource.backend.folder.entity.Folder;
import resource.backend.user.entity.User;

@Entity
@Table(name = "resources")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Resource extends BaseEntity {

    @Column(nullable = false)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "mime_type")
    private String mimeType;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id", nullable = false)
    private User owner;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "folder_id")
    private Folder folder;

    @Type(ResourceTypeUserType.class)
    @Column(name = "resource_type", nullable = false, columnDefinition = "resource_type")
    private ResourceType resourceType = ResourceType.OTHER;

    @Column(name = "drive_file_id", nullable = false, unique = true)
    private String driveFileId;

    @Column(name = "drive_url", nullable = false)
    private String driveUrl;

    @Column(name = "like_count", nullable = false)
    private Integer likeCount = 0;

    @Column(name = "view_count", nullable = false)
    private Integer viewCount = 0;

    // Generated full-text search vector (read-only)
    @Column(name = "search_vector", insertable = false, updatable = false, columnDefinition = "tsvector")
    private String searchVector;
}