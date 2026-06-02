package resource.backend.folder.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import resource.backend.folder.entity.Folder;

import java.util.List;
import java.util.UUID;

@Repository
public interface FolderRepository extends JpaRepository<Folder, java.util.UUID> {

    @Query(value = """
            WITH RECURSIVE descendants AS (
                SELECT id FROM folders WHERE id = :rootFolderId
                UNION ALL
                SELECT f.id FROM folders f
                INNER JOIN descendants d ON f.parent_id = d.id
            )
            SELECT f.* FROM folders f
            INNER JOIN descendants d ON f.id = d.id
            WHERE LOWER(f.name) LIKE LOWER(CONCAT('%%', :keyword, '%%'))
            """, nativeQuery = true)
    List<Folder> findMatchingDescendants(UUID rootFolderId, String keyword);
}
