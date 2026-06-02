package resource.backend.academic.repository;

import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import resource.backend.academic.entity.Course;

@Repository
public interface CourseRepository extends JpaRepository<Course, UUID> {

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