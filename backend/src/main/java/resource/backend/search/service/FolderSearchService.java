package resource.backend.search.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import resource.backend.folder.repository.FolderRepository;
import resource.backend.resource.repository.ResourceRepository;
import resource.backend.search.dto.SearchResult;
import resource.backend.search.dto.SearchResult.SearchResultType;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class FolderSearchService {

    private final FolderRepository folderRepository;
    private final ResourceRepository resourceRepository;

    public List<SearchResult> searchWithinFolder(UUID rootFolderId, String keyword) {
        List<SearchResult> results = new ArrayList<>();
        results.addAll(findMatchingFolders(rootFolderId, keyword));
        results.addAll(findMatchingResources(rootFolderId, keyword));
        return results;
    }

    private List<SearchResult> findMatchingFolders(UUID rootFolderId, String keyword) {
        return folderRepository.findMatchingDescendants(rootFolderId, keyword)
                .stream()
                .map(folder -> new SearchResult(folder.getId(), folder.getName(), SearchResultType.FOLDER))
                .toList();
    }

    private List<SearchResult> findMatchingResources(UUID rootFolderId, String keyword) {
        return resourceRepository.findMatchingInDescendants(rootFolderId, keyword)
                .stream()
                .map(resource -> new SearchResult(resource.getId(), resource.getName(), SearchResultType.RESOURCE))
                .toList();
    }
}
