package resource.backend.resource.entity;

import lombok.Getter;

@Getter
public enum ResourceType {
    DOCUMENT("document"),
    VIDEO("video"),
    IMAGE("image"),
    AUDIO("audio"),
    LINK("link"),
    OTHER("other");

    private final String dbValue;

    ResourceType(String dbValue) {
        this.dbValue = dbValue;
    }

    public static ResourceType fromDbValue(String value) {
        for (ResourceType type : ResourceType.values()) {
            if (type.dbValue.equalsIgnoreCase(value)) {
                return type;
            }
        }
        return OTHER;
    }
}