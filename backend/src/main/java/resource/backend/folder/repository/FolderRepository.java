package resource.backend.folder.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import resource.backend.folder.entity.Folder;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface FolderRepository extends JpaRepository<Folder, UUID> {

    // Your existing methods (Keep these!)
    Optional<Folder> findByOwnerIdAndNameAndParentIsNull(UUID ownerId, String name);
    Optional<Folder> findByDriveFolderId(String driveFolderId);

    // --- ADD THESE FOR THE FEATURE ---
    // Finds all subfolders inside a specific parent folder chamber
    List<Folder> findByParentId(UUID parentId);

    // Backup: Finds folders at the absolute top-level root (where parent_id IS NULL)
    List<Folder> findByParentIdIsNull();
}