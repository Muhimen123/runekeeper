// resource/backend/reward/entity/RewardActionUserType.java
package resource.backend.reward.entity;

import resource.backend.common.type.PostgreSQLEnumType;

public class RewardActionUserType extends PostgreSQLEnumType<RewardAction> {
    public RewardActionUserType() { super(RewardAction.class); }
}