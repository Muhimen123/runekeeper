package resource.backend.search.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.util.UUID;

@Getter
@AllArgsConstructor
public class SearchResult {

    private final UUID id;
    private final String name;
    private final SearchResultType type;

    public enum SearchResultType {
        FOLDER,
        RESOURCE
    }
}
