package resource.backend.academic.entity;

import jakarta.persistence.*;
import lombok.*;
import resource.backend.common.entity.BaseEntity;
import resource.backend.folder.entity.Folder;

@Entity
@Table(name = "courses", uniqueConstraints = { @UniqueConstraint(columnNames = { "semester_id", "name" }) })
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Course extends BaseEntity {

    @Column(nullable = false)
    private String name;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "semester_id", nullable = false)
    private Semester semester;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "root_folder_id")
    private Folder rootFolder;
}
