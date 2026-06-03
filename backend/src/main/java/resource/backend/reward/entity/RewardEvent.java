package resource.backend.reward.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.Type;
import resource.backend.common.entity.BaseEntity;
import resource.backend.user.entity.User;
import resource.backend.resource.entity.Resource;
import resource.backend.syllabus.entity.SyllabusItem;
import resource.backend.badge.entity.Badge;
import resource.backend.suggestion.entity.Suggestion;

@Entity
@Table(name = "reward_events")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class RewardEvent extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Type(RewardActionUserType.class)
    @Column(name = "action", nullable = false, columnDefinition = "reward_action")
    private RewardAction action;

    @Column(nullable = false)
    private Integer points;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "rewarded_resource_id")
    private Resource rewardedResource;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "rewarded_syllabus_item_id")
    private SyllabusItem rewardedSyllabusItem;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "rewarded_badge_id")
    private Badge rewardedBadge;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "rewarded_suggestion_id")
    private Suggestion rewardedSuggestion;
}
