package resource.backend.academic.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import resource.backend.academic.entity.Course;

@Repository
public interface CourseRepository extends JpaRepository<Course, UUID> {

    // 1. ADD THIS METHOD: Fetches a flat list of courses for your Next.js directory view
    List<Course> findBySemesterId(UUID semesterId);

    // Keep this if you still have separate paginated admin panels elsewhere
    Page<Course> findBySemesterId(
            UUID semesterId,
            Pageable pageable);

    Optional<Course> findByIdAndSemesterId(
            UUID courseId,
            UUID semesterId);

    boolean existsBySemesterIdAndName(
            UUID semesterId,
            String name);
}