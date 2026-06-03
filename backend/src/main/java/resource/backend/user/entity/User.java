package resource.backend.user.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import resource.backend.common.entity.BaseEntity;
import resource.backend.avatar.entity.Avatar;

import java.util.UUID;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class User extends BaseEntity {

    @Column(name = "auth_id", nullable = false, unique = true)
    private UUID authId;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "avatar_id", unique = true)
    private Avatar avatar;

    @Column(nullable = false, unique = true)
    private String username;

    @Column(name = "display_name", nullable = false)
    private String displayName;

    @Column(name = "reward_points", nullable = false)
    private Integer rewardPoints = 0;

}
