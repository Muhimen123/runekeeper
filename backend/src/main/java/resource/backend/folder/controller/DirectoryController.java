package resource.backend.folder.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import resource.backend.academic.repository.CourseRepository;
import resource.backend.folder.dto.CreateFolderRequest;
import resource.backend.folder.entity.Folder;
import resource.backend.folder.repository.FolderRepository;
import resource.backend.folder.service.FolderService;
import resource.backend.resource.entity.Resource;
import resource.backend.resource.repository.ResourceRepository;
import resource.backend.academic.entity.Course;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/directory")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3000") // Allows your Next.js app to communicate safely
public class DirectoryController {

    private final FolderService folderService;
    private final FolderRepository folderRepository;
    private final ResourceRepository resourceRepository;
    private final CourseRepository courseRepository;

    /**
     * Step 3: Create a new subfolder/chamber inside a parent directory.
     * Maps to frontend: POST http://localhost:8080/api/v1/directory/folders
     */
    @PostMapping("/folders")
    public ResponseEntity<Folder> createFolder(
            @RequestParam UUID userId,
            @RequestParam String folderName,
            @RequestParam UUID parentFolderId) {

        CreateFolderRequest request = new CreateFolderRequest(folderName, parentFolderId, userId);
        Folder savedFolder = folderService.createNewFolder(request);

        return ResponseEntity.ok(savedFolder);
    }

    /**
     * Step 2: Fetch all subfolders matching a parent folder ID.
     * Maps to frontend: GET http://localhost:8080/api/v1/directory/folders?parentFolderId=...
     */
    @GetMapping("/folders")
    public ResponseEntity<List<Folder>> getSubFolders(
            @RequestParam UUID parentFolderId,
            @RequestParam(required = false) UUID userId) {

        List<Folder> subFolders = folderRepository.findByParentId(parentFolderId);
        return ResponseEntity.ok(subFolders);
    }

    /**
     * Step 2: Fetch all static resources/scroll files inside a folder chamber.
     * Maps to frontend: GET http://localhost:8080/api/v1/directory/resources?folderId=...
     */
    @GetMapping("/resources")
    public ResponseEntity<List<Resource>> getFolderResources(
            @RequestParam UUID folderId,
            @RequestParam(required = false) UUID userId) {

        List<Resource> resources = resourceRepository.findByFolderId(folderId);

        // FUTURE ENHANCEMENT ANALYTICS HOOK:
        // This is where we can trigger incremental view logging scripts
        // to fire reward points later on!

        return ResponseEntity.ok(resources);
    }

}