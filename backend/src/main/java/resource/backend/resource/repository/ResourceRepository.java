package resource.backend.resource.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import resource.backend.resource.entity.Resource;

import java.util.List;
import java.util.UUID;

@Repository
public interface ResourceRepository extends JpaRepository<Resource, UUID> {

    List<Resource> findByFolderId(UUID folderId);

    /**
     * Executes the authoritative gamification point function defined in the database schema.
     */
    @Query(value = "SELECT award_points(:userId, :activityType, :points, :referenceId)", nativeQuery = true)
    void awardGamificationPoints(
            @Param("userId") UUID userId,
            @Param("activityType") String activityType,
            @Param("points") Integer points,
            @Param("referenceId") String referenceId
    );
}