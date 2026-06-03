// resource/backend/resource/entity/ResourceTypeUserType.java
package resource.backend.resource.entity;

import resource.backend.common.type.PostgreSQLEnumType;

public class ResourceTypeUserType extends PostgreSQLEnumType<ResourceType> {
    public ResourceTypeUserType() { super(ResourceType.class); }
}