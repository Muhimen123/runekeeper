package resource.backend.folder.entity;

import jakarta.persistence.*;
import lombok.*;
import resource.backend.common.entity.BaseEntity;
import resource.backend.user.entity.User;
import java.util.UUID;

@Entity
@Table(name = "folders")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Folder extends BaseEntity {

    @Column(nullable = false)
    private String name;

    @Column(name = "drive_folder_id", nullable = false, unique = true)
    private String driveFolderId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_id")
    private Folder parent;

    // --- ADD THIS RENDER READ-ONLY FIELD FOR EASY API QUERYING ---
    @Column(name = "parent_id", insertable = false, updatable = false)
    private UUID parentId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id")
    private User owner;
}