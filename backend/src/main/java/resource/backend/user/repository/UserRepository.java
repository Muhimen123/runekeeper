package resource.backend.user.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import resource.backend.user.entity.User;
import java.util.UUID;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, UUID> {
    // Looks up the record by the explicit Supabase unique link column
    Optional<User> findByAuthId(UUID authId);
}