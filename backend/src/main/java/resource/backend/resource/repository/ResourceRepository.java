package resource.backend.resource.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import resource.backend.resource.entity.Resource;

import java.util.List;
import java.util.UUID;

@Repository
public interface ResourceRepository extends JpaRepository<Resource, java.util.UUID> {

    List<Resource> findByFolderId(UUID folderId);

    @Query(value = """
            WITH RECURSIVE descendants AS (
                SELECT id FROM folders WHERE id = :rootFolderId
                UNION ALL
                SELECT f.id FROM folders f
                INNER JOIN descendants d ON f.parent_id = d.id
            )
            SELECT r.* FROM resources r
            INNER JOIN descendants d ON r.folder_id = d.id
            WHERE LOWER(r.name) LIKE LOWER(CONCAT('%%', :keyword, '%%'))
            """, nativeQuery = true)
    List<Resource> findMatchingInDescendants(UUID rootFolderId, String keyword);
}
