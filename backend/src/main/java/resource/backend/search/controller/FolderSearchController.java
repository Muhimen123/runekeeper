package resource.backend.search.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import resource.backend.search.dto.SearchResult;
import resource.backend.search.service.FolderSearchService;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/folders")
@RequiredArgsConstructor
public class FolderSearchController {

    private final FolderSearchService folderSearchService;

    @GetMapping("/{folderId}/search")
    public ResponseEntity<List<SearchResult>> searchInFolder(
            @PathVariable UUID folderId,
            @RequestParam String keyword) {
        List<SearchResult> results = folderSearchService.searchWithinFolder(folderId, keyword);
        return ResponseEntity.ok(results);
    }
}
