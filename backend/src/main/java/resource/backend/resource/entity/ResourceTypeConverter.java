package resource.backend.resource.entity;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter(autoApply = true)
public class ResourceTypeConverter implements AttributeConverter<ResourceType, String> {

    @Override
    public String convertToDatabaseColumn(ResourceType attribute) {
        if (attribute == null) {
            return null;
        }
        return attribute.name().toLowerCase();
    }

    @Override
    public ResourceType convertToEntityAttribute(String dbData) {
        if (dbData == null) {
            return null;
        }
        try {
            return ResourceType.valueOf(dbData.toUpperCase());
        } catch (IllegalArgumentException e) {
            return ResourceType.OTHER;
        }
    }
}
