-- =============================================================================
-- Resource Centralization App — Production PostgreSQL Schema
-- =============================================================================
-- Conventions:
--   • snake_case for all identifiers
--   • UUID primary keys via uuid_generate_v4()
--   • TIMESTAMPTZ for all timestamps
--   • Explicit FK constraints with ON DELETE / ON UPDATE behaviors
--   • CHECK constraints to enforce business rules
--   • Indexes on all FKs and high-frequency query columns
-- =============================================================================
-- Changelog v4:
--   • reward_events: replaced polymorphic (reference_type, reference_id) with
--     typed nullable FK columns + CHECK (exactly one non-null)
--   • folders: added cycle-prevention trigger (recursive CTE ancestry walk)
--   • users.username: added CHECK (username = lower(username)) + functional
--     unique index on lower(username) for case-insensitive uniqueness
--   • resources: added generated tsvector column (search_vector) covering name,
--     description, and mime_type + GIN index for full-text search
--   • Junction tables (resource_tags, resource_likes, resource_views,
--     user_badges): removed updated_at column and trigger — these tables are
--     insert/delete only; updated_at adds overhead with no benefit.
--     Junction tables with mutable fields (suggestion_resources) keep it.
--   • resource_views: added comment clarifying that PRIMARY KEY(user_id,
--     resource_id) already prevents view count inflation per user.
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- UTILITY: auto-update updated_at on every updatable table
-- =============================================================================

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

-- =============================================================================
-- SECTION 1: AVATAR SYSTEM (Cosmetic Parts)
-- =============================================================================

CREATE TABLE avatar_skins (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name         TEXT NOT NULL UNIQUE,
    graphics_url TEXT NOT NULL,
    position     JSONB,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TRIGGER trg_avatar_skins_updated_at
    BEFORE UPDATE ON avatar_skins
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE avatar_noses (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name         TEXT NOT NULL UNIQUE,
    graphics_url TEXT NOT NULL,
    position     JSONB,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TRIGGER trg_avatar_noses_updated_at
    BEFORE UPDATE ON avatar_noses
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE avatar_eyes (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name         TEXT NOT NULL UNIQUE,
    graphics_url TEXT NOT NULL,
    position     JSONB,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TRIGGER trg_avatar_eyes_updated_at
    BEFORE UPDATE ON avatar_eyes
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE avatar_mouths (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name         TEXT NOT NULL UNIQUE,
    graphics_url TEXT NOT NULL,
    position     JSONB,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TRIGGER trg_avatar_mouths_updated_at
    BEFORE UPDATE ON avatar_mouths
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE avatar_accessories (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name         TEXT NOT NULL UNIQUE,
    graphics_url TEXT NOT NULL,
    position     JSONB,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TRIGGER trg_avatar_accessories_updated_at
    BEFORE UPDATE ON avatar_accessories
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Assembled avatar: nullable FKs so removing a part doesn't break the avatar.
CREATE TABLE avatars (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    skin_id      UUID REFERENCES avatar_skins(id)       ON DELETE SET NULL ON UPDATE CASCADE,
    nose_id      UUID REFERENCES avatar_noses(id)       ON DELETE SET NULL ON UPDATE CASCADE,
    eye_id       UUID REFERENCES avatar_eyes(id)        ON DELETE SET NULL ON UPDATE CASCADE,
    mouth_id     UUID REFERENCES avatar_mouths(id)      ON DELETE SET NULL ON UPDATE CASCADE,
    accessory_id UUID REFERENCES avatar_accessories(id) ON DELETE SET NULL ON UPDATE CASCADE,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TRIGGER trg_avatars_updated_at
    BEFORE UPDATE ON avatars
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- =============================================================================
-- SECTION 2: BADGES
-- =============================================================================

CREATE TABLE badges (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name         TEXT NOT NULL UNIQUE,
    description  TEXT NOT NULL,
    graphics_url TEXT NOT NULL,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TRIGGER trg_badges_updated_at
    BEFORE UPDATE ON badges
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- =============================================================================
-- SECTION 3: USERS
-- =============================================================================
-- auth_id    — references Supabase managed auth.users; never insert here directly.
-- username   — unique handle (e.g. sadik_hasan). Enforced lowercase via CHECK
--              and a functional unique index so 'Sadik' and 'sadik' are the same.
-- display_name — freeform label shown in UI (e.g. Sadik Hasan); no uniqueness.

CREATE TABLE users (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    auth_id       UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE ON UPDATE CASCADE,
    avatar_id     UUID UNIQUE REFERENCES avatars(id) ON DELETE SET NULL ON UPDATE CASCADE,
    username      TEXT NOT NULL UNIQUE CHECK (username = lower(username)),
    display_name  TEXT NOT NULL,
    reward_points INTEGER NOT NULL DEFAULT 0 CHECK (reward_points >= 0),
    created_at    TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Functional unique index: belt-and-suspenders guard ensuring case-insensitive
-- uniqueness even if the CHECK constraint is bypassed at the extension level.
CREATE UNIQUE INDEX idx_users_username_lower ON users (lower(username));

-- Junction: Users ↔ Badges (many-to-many)
-- Insert/delete only — no updated_at needed.
CREATE TABLE user_badges (
    user_id    UUID NOT NULL REFERENCES users(id)  ON DELETE CASCADE ON UPDATE CASCADE,
    badge_id   UUID NOT NULL REFERENCES badges(id) ON DELETE CASCADE ON UPDATE CASCADE,
    earned_at  TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, badge_id)
);

-- =============================================================================
-- SECTION 3b: GOOGLE DRIVE OAUTH CREDENTIALS
-- =============================================================================
-- Stores encrypted OAuth credentials for users who link their own Google Drives.
-- PRIMARY KEY(user_id) ensures exactly one active Google integration per user account.

CREATE TABLE user_google_tokens (
    user_id       UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
    access_token  TEXT NOT NULL,
    refresh_token TEXT NOT NULL, -- Keep this safely guarded!
    expiry_time   TIMESTAMPTZ NOT NULL,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER trg_user_google_tokens_updated_at
    BEFORE UPDATE ON user_google_tokens
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Index for checking integration status quickly
CREATE INDEX idx_user_google_tokens_user_id ON user_google_tokens(user_id);

-- =============================================================================
-- SECTION 4: DRIVE-BACKED FOLDER HIERARCHY
-- =============================================================================
-- Self-referencing parent_id supports arbitrary folder depth.
-- Cycle prevention (A→B→C→A) is enforced by the trigger below.

CREATE TABLE folders (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name            TEXT NOT NULL,
    drive_folder_id TEXT NOT NULL UNIQUE,
    parent_id       UUID REFERENCES folders(id) ON DELETE SET NULL ON UPDATE CASCADE,
    owner_id        UUID REFERENCES users(id)   ON DELETE SET NULL ON UPDATE CASCADE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TRIGGER trg_folders_updated_at
    BEFORE UPDATE ON folders
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- -----------------------------------------------------------------------------
-- Folder cycle prevention
-- Walks the ancestor chain via recursive CTE before any INSERT or UPDATE that
-- sets a parent_id. Raises an exception if the folder's own ID appears in its
-- ancestry — which would form a cycle.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION prevent_folder_cycle()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    -- Only check when a parent is actually being set
    IF NEW.parent_id IS NULL THEN
        RETURN NEW;
    END IF;

    -- A folder cannot be its own parent
    IF NEW.parent_id = NEW.id THEN
        RAISE EXCEPTION 'Folder cycle detected: a folder cannot be its own parent (id: %).', NEW.id;
    END IF;

    -- Walk the full ancestor chain; if NEW.id appears, we have a cycle
    IF EXISTS (
        WITH RECURSIVE ancestry AS (
            SELECT f.id, f.parent_id
            FROM   folders f
            WHERE  f.id = NEW.parent_id

            UNION ALL

            SELECT f.id, f.parent_id
            FROM   folders f
            INNER JOIN ancestry a ON f.id = a.parent_id
        )
        SELECT 1 FROM ancestry WHERE id = NEW.id
    ) THEN
        RAISE EXCEPTION 'Folder cycle detected: setting parent_id = % on folder % would create a cycle.',
            NEW.parent_id, NEW.id;
    END IF;

    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_prevent_folder_cycle
    BEFORE INSERT OR UPDATE OF parent_id ON folders
    FOR EACH ROW EXECUTE FUNCTION prevent_folder_cycle();

-- =============================================================================
-- SECTION 5: SEMESTERS & COURSES
-- =============================================================================

CREATE TABLE semesters (
    id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name       TEXT NOT NULL,
    owner_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (owner_id, name)
);
CREATE TRIGGER trg_semesters_updated_at
    BEFORE UPDATE ON semesters
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE courses (
    id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name           TEXT NOT NULL,
    semester_id    UUID NOT NULL REFERENCES semesters(id) ON DELETE CASCADE  ON UPDATE CASCADE,
    root_folder_id UUID           REFERENCES folders(id)  ON DELETE SET NULL ON UPDATE CASCADE,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (semester_id, name)
);
CREATE TRIGGER trg_courses_updated_at
    BEFORE UPDATE ON courses
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- =============================================================================
-- SECTION 6: TAGS
-- =============================================================================

CREATE TABLE tags (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name        TEXT NOT NULL,
    semester_id UUID NOT NULL REFERENCES semesters(id) ON DELETE CASCADE ON UPDATE CASCADE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (semester_id, name)
);
CREATE TRIGGER trg_tags_updated_at
    BEFORE UPDATE ON tags
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- =============================================================================
-- SECTION 7: RESOURCES (Drive-backed files)
-- =============================================================================
-- like_count  — maintained by trigger on resource_likes (INSERT / DELETE).
-- view_count  — maintained by trigger on resource_views (INSERT only).
--               PRIMARY KEY(user_id, resource_id) on resource_views means each
--               user contributes at most one view, preventing count inflation.
--
-- search_vector — generated tsvector for full-text search across name,
--                 description, and mime_type. Updated automatically on INSERT
--                 or UPDATE via the trg_resources_search_vector trigger.
--                 Query with: search_vector @@ plainto_tsquery('english', $1)
--
-- mime_type   — low-cardinality column (~6 values). Not indexed with a plain
--               B-tree (PostgreSQL would ignore it). Use partial indexes per
--               type if a specific filter becomes a hot path, e.g.:
--               CREATE INDEX ON resources(id) WHERE mime_type = 'application/pdf';

CREATE TYPE resource_type AS ENUM ('document', 'video', 'image', 'audio', 'link', 'other');

CREATE TABLE resources (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name          TEXT NOT NULL,
    description   TEXT,
    mime_type     TEXT,
    owner_id      UUID NOT NULL REFERENCES users(id)    ON DELETE CASCADE  ON UPDATE CASCADE,
    folder_id     UUID           REFERENCES folders(id) ON DELETE SET NULL ON UPDATE CASCADE,
    resource_type resource_type NOT NULL DEFAULT 'other',
    drive_file_id TEXT NOT NULL UNIQUE,
    drive_url     TEXT NOT NULL,
    like_count    INTEGER NOT NULL DEFAULT 0 CHECK (like_count >= 0),
    view_count    INTEGER NOT NULL DEFAULT 0 CHECK (view_count >= 0),
    search_vector TSVECTOR GENERATED ALWAYS AS (
        setweight(to_tsvector('english', coalesce(name, '')),        'A') ||
        setweight(to_tsvector('english', coalesce(description, '')), 'B') ||
        setweight(to_tsvector('english', coalesce(mime_type, '')),   'C')
    ) STORED,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TRIGGER trg_resources_updated_at
    BEFORE UPDATE ON resources
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- GIN index on the generated tsvector — required for performant FTS queries
CREATE INDEX idx_resources_search_vector ON resources USING GIN (search_vector);

-- Junction: Resources ↔ Tags (insert/delete only — no updated_at)
CREATE TABLE resource_tags (
    resource_id UUID NOT NULL REFERENCES resources(id) ON DELETE CASCADE ON UPDATE CASCADE,
    tag_id      UUID NOT NULL REFERENCES tags(id)      ON DELETE CASCADE ON UPDATE CASCADE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (resource_id, tag_id)
);

-- -----------------------------------------------------------------------------
-- resource_likes
-- One row per (user, resource). Trigger maintains resources.like_count.
-- Insert/delete only — no updated_at.
-- -----------------------------------------------------------------------------
CREATE TABLE resource_likes (
    user_id     UUID NOT NULL REFERENCES users(id)     ON DELETE CASCADE ON UPDATE CASCADE,
    resource_id UUID NOT NULL REFERENCES resources(id) ON DELETE CASCADE ON UPDATE CASCADE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, resource_id)
);

CREATE OR REPLACE FUNCTION sync_like_count()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE resources
        SET like_count = like_count + 1,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = NEW.resource_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE resources
        SET like_count = GREATEST(like_count - 1, 0),
            updated_at = CURRENT_TIMESTAMP
        WHERE id = OLD.resource_id;
    END IF;
    RETURN NULL;
END;
$$;

CREATE TRIGGER trg_sync_like_count
AFTER INSERT OR DELETE ON resource_likes
FOR EACH ROW EXECUTE FUNCTION sync_like_count();

-- -----------------------------------------------------------------------------
-- resource_views
-- PRIMARY KEY(user_id, resource_id) = one row per user per resource.
-- Re-visiting the resource updates viewed_at via ON CONFLICT DO UPDATE but does
-- NOT fire the INSERT trigger again, so view_count counts unique users only.
-- Insert only — no updated_at.
-- -----------------------------------------------------------------------------
CREATE TABLE resource_views (
    user_id     UUID NOT NULL REFERENCES users(id)     ON DELETE CASCADE ON UPDATE CASCADE,
    resource_id UUID NOT NULL REFERENCES resources(id) ON DELETE CASCADE ON UPDATE CASCADE,
    viewed_at   TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, resource_id)
);

CREATE OR REPLACE FUNCTION sync_view_count()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    -- Fires only on genuine INSERT (first view per user).
    -- ON CONFLICT DO UPDATE re-visits do not reach this trigger.
    UPDATE resources
    SET view_count = view_count + 1,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.resource_id;
    RETURN NULL;
END;
$$;

CREATE TRIGGER trg_sync_view_count
AFTER INSERT ON resource_views
FOR EACH ROW EXECUTE FUNCTION sync_view_count();

-- =============================================================================
-- SECTION 8: AI-GENERATED CONTENT VIEWER METADATA
-- =============================================================================

CREATE TABLE resource_ai_metadata (
    id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    resource_id        UUID NOT NULL UNIQUE REFERENCES resources(id) ON DELETE CASCADE ON UPDATE CASCADE,
    summary            TEXT,
    practice_questions JSONB,   -- [{question, choices[], answer}] — normalize in v2
    generated_at       TIMESTAMPTZ,
    created_at         TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at         TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TRIGGER trg_resource_ai_metadata_updated_at
    BEFORE UPDATE ON resource_ai_metadata
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Per-user reading progress and quiz score on a resource
CREATE TABLE user_resource_progress (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id       UUID NOT NULL REFERENCES users(id)     ON DELETE CASCADE ON UPDATE CASCADE,
    resource_id   UUID NOT NULL REFERENCES resources(id) ON DELETE CASCADE ON UPDATE CASCADE,
    progress_pct  SMALLINT NOT NULL DEFAULT 0 CHECK (progress_pct BETWEEN 0 AND 100),
    quiz_score    SMALLINT CHECK (quiz_score BETWEEN 0 AND 100),
    last_accessed TIMESTAMPTZ,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (user_id, resource_id)
);
CREATE TRIGGER trg_user_resource_progress_updated_at
    BEFORE UPDATE ON user_resource_progress
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- =============================================================================
-- SECTION 9: EVENT TYPES & EVENTS
-- =============================================================================
-- semester_id is intentionally absent from events.
-- Derive semester via: event → course → semester (no redundancy / no conflicts).

CREATE TABLE event_types (
    id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name       TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TRIGGER trg_event_types_updated_at
    BEFORE UPDATE ON event_types
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE events (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name          TEXT NOT NULL,
    event_type_id UUID NOT NULL REFERENCES event_types(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    course_id     UUID NOT NULL REFERENCES courses(id)     ON DELETE CASCADE  ON UPDATE CASCADE,
    event_date    TIMESTAMPTZ NOT NULL,
    location      TEXT,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TRIGGER trg_events_updated_at
    BEFORE UPDATE ON events
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- =============================================================================
-- SECTION 10: SYLLABUS & CHECKLIST SYSTEM
-- =============================================================================
-- One syllabus per event (enforced by UNIQUE on event_id).
-- syllabus_items are the individual topic/chapter rows within a syllabus.
-- sequence_no with UNIQUE(syllabus_id, sequence_no) enforces clean ordering.

CREATE TABLE syllabi (
    id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name       TEXT NOT NULL,
    event_id   UUID NOT NULL UNIQUE REFERENCES events(id) ON DELETE CASCADE ON UPDATE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TRIGGER trg_syllabi_updated_at
    BEFORE UPDATE ON syllabi
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE syllabus_items (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    syllabus_id UUID NOT NULL REFERENCES syllabi(id) ON DELETE CASCADE ON UPDATE CASCADE,
    title       TEXT NOT NULL,
    description TEXT,
    sequence_no INTEGER NOT NULL DEFAULT 0,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (syllabus_id, sequence_no)
);
CREATE TRIGGER trg_syllabus_items_updated_at
    BEFORE UPDATE ON syllabus_items
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Per-user completion state for each syllabus item (the gamified checklist)
CREATE TABLE user_syllabus_progress (
    id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id          UUID NOT NULL REFERENCES users(id)          ON DELETE CASCADE ON UPDATE CASCADE,
    syllabus_item_id UUID NOT NULL REFERENCES syllabus_items(id) ON DELETE CASCADE ON UPDATE CASCADE,
    is_completed     BOOLEAN NOT NULL DEFAULT FALSE,
    completed_at     TIMESTAMPTZ,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (user_id, syllabus_item_id)
);
CREATE TRIGGER trg_user_syllabus_progress_updated_at
    BEFORE UPDATE ON user_syllabus_progress
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- =============================================================================
-- SECTION 11: SUGGESTIONS SYSTEM
-- =============================================================================

CREATE TYPE suggestion_status AS ENUM ('pending', 'approved', 'rejected');

CREATE TABLE suggestions (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id    UUID NOT NULL REFERENCES users(id)    ON DELETE CASCADE  ON UPDATE CASCADE,
    syllabus_id UUID           REFERENCES syllabi(id) ON DELETE SET NULL ON UPDATE CASCADE,
    body_text   TEXT,
    status      suggestion_status NOT NULL DEFAULT 'pending',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TRIGGER trg_suggestions_updated_at
    BEFORE UPDATE ON suggestions
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Junction with mutable annotation field — keeps updated_at
CREATE TABLE suggestion_resources (
    suggestion_id UUID NOT NULL REFERENCES suggestions(id) ON DELETE CASCADE ON UPDATE CASCADE,
    resource_id   UUID NOT NULL REFERENCES resources(id)   ON DELETE CASCADE ON UPDATE CASCADE,
    annotation    TEXT,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (suggestion_id, resource_id)
);
CREATE TRIGGER trg_suggestion_resources_updated_at
    BEFORE UPDATE ON suggestion_resources
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Suggestion must have body_text OR at least one linked resource (not neither)
CREATE OR REPLACE FUNCTION check_suggestion_not_empty()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    IF NEW.body_text IS NULL THEN
        IF NOT EXISTS (
            SELECT 1 FROM suggestion_resources WHERE suggestion_id = NEW.id
        ) THEN
            RAISE EXCEPTION 'A suggestion must have either body_text or at least one linked resource.';
        END IF;
    END IF;
    RETURN NEW;
END;
$$;

CREATE CONSTRAINT TRIGGER trg_suggestion_not_empty
AFTER INSERT OR UPDATE ON suggestions
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW EXECUTE FUNCTION check_suggestion_not_empty();

-- =============================================================================
-- SECTION 12: REWARD & GAMIFICATION SYSTEM
-- =============================================================================
-- reward_events stores one typed nullable FK per rewardable entity type.
-- A CHECK constraint enforces that exactly one FK is non-null per row, giving
-- full referential integrity with no polymorphic ambiguity.
--
-- Rewardable entity columns:
--   rewarded_resource_id      — for resource_upload, resource_liked
--   rewarded_syllabus_item_id — for syllabus_item_completed
--   rewarded_badge_id         — for badge_earned
--   rewarded_suggestion_id    — for suggestion_accepted
--
-- award_points() is the ONLY authorised entry point for granting points.
-- Application code must NEVER UPDATE users.reward_points directly.

CREATE TYPE reward_action AS ENUM (
    'resource_upload',
    'resource_liked',
    'syllabus_item_completed',
    'badge_earned',
    'suggestion_accepted'
);

CREATE TABLE reward_events (
    id                        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id                   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
    action                    reward_action NOT NULL,
    points                    INTEGER NOT NULL CHECK (points > 0),

    -- Typed nullable FKs — exactly one must be non-null (enforced by CHECK below)
    rewarded_resource_id      UUID REFERENCES resources(id)      ON DELETE SET NULL ON UPDATE CASCADE,
    rewarded_syllabus_item_id UUID REFERENCES syllabus_items(id) ON DELETE SET NULL ON UPDATE CASCADE,
    rewarded_badge_id         UUID REFERENCES badges(id)         ON DELETE SET NULL ON UPDATE CASCADE,
    rewarded_suggestion_id    UUID REFERENCES suggestions(id)    ON DELETE SET NULL ON UPDATE CASCADE,

    created_at  TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Enforce exactly one reference per reward event
    CONSTRAINT chk_reward_events_single_reference CHECK (
        (
            (rewarded_resource_id      IS NOT NULL)::INT +
            (rewarded_syllabus_item_id IS NOT NULL)::INT +
            (rewarded_badge_id         IS NOT NULL)::INT +
            (rewarded_suggestion_id    IS NOT NULL)::INT
        ) = 1
    )
);
CREATE TRIGGER trg_reward_events_updated_at
    BEFORE UPDATE ON reward_events
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Sync trigger: keeps users.reward_points current after every insert
CREATE OR REPLACE FUNCTION sync_reward_points()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    UPDATE users
    SET reward_points = reward_points + NEW.points,
        updated_at    = CURRENT_TIMESTAMP
    WHERE id = NEW.user_id;
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_sync_reward_points
AFTER INSERT ON reward_events
FOR EACH ROW EXECUTE FUNCTION sync_reward_points();

-- =============================================================================
-- award_points()
-- =============================================================================
-- Single authoritative entry point. Pass exactly one reference UUID — the
-- function maps the action to the correct typed FK column automatically.
--
-- Usage examples:
--   SELECT award_points('user-uuid', 'resource_upload',         50, '55555555-...');
--   SELECT award_points('user-uuid', 'syllabus_item_completed', 10, '99999999-...');
--   SELECT award_points('user-uuid', 'badge_earned',            25, 'cccccccc-...');
--   SELECT award_points('user-uuid', 'suggestion_accepted',     15, 'aaaaaaab-...');

CREATE OR REPLACE FUNCTION award_points(
    p_user_id     UUID,
    p_action      reward_action,
    p_points      INTEGER,
    p_reference   UUID    -- the ID of the triggering entity
)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
    IF p_points <= 0 THEN
        RAISE EXCEPTION 'award_points: points must be a positive integer, got %.', p_points;
    END IF;

    INSERT INTO reward_events (
        user_id, action, points,
        rewarded_resource_id,
        rewarded_syllabus_item_id,
        rewarded_badge_id,
        rewarded_suggestion_id
    )
    VALUES (
        p_user_id,
        p_action,
        p_points,
        CASE WHEN p_action IN ('resource_upload', 'resource_liked')  THEN p_reference END,
        CASE WHEN p_action = 'syllabus_item_completed'               THEN p_reference END,
        CASE WHEN p_action = 'badge_earned'                          THEN p_reference END,
        CASE WHEN p_action = 'suggestion_accepted'                   THEN p_reference END
    );
END;
$$;

-- =============================================================================
-- SECTION 13: INDEXES FOR PERFORMANCE
-- =============================================================================

-- Users
CREATE INDEX idx_users_auth_id   ON users(auth_id);
CREATE INDEX idx_users_avatar_id ON users(avatar_id);
-- idx_users_username_lower defined above alongside the column

-- User Badges
CREATE INDEX idx_user_badges_user_id  ON user_badges(user_id);
CREATE INDEX idx_user_badges_badge_id ON user_badges(badge_id);

-- Folders
CREATE INDEX idx_folders_parent_id ON folders(parent_id);
CREATE INDEX idx_folders_owner_id  ON folders(owner_id);

-- Semesters
CREATE INDEX idx_semesters_owner_id ON semesters(owner_id);

-- Courses
CREATE INDEX idx_courses_semester_id    ON courses(semester_id);
CREATE INDEX idx_courses_root_folder_id ON courses(root_folder_id);

-- Tags
CREATE INDEX idx_tags_semester_id ON tags(semester_id);
CREATE INDEX idx_tags_name        ON tags(name);

-- Resources
CREATE INDEX idx_resources_owner_id      ON resources(owner_id);
CREATE INDEX idx_resources_folder_id     ON resources(folder_id);
CREATE INDEX idx_resources_drive_url     ON resources(drive_url);
CREATE INDEX idx_resources_resource_type ON resources(resource_type);
-- idx_resources_search_vector (GIN) defined above alongside the column

-- Resource Tags
CREATE INDEX idx_resource_tags_resource_id ON resource_tags(resource_id);
CREATE INDEX idx_resource_tags_tag_id      ON resource_tags(tag_id);

-- Resource Likes
CREATE INDEX idx_resource_likes_resource_id ON resource_likes(resource_id);
CREATE INDEX idx_resource_likes_user_id     ON resource_likes(user_id);

-- Resource Views
CREATE INDEX idx_resource_views_resource_id ON resource_views(resource_id);
CREATE INDEX idx_resource_views_user_id     ON resource_views(user_id);
CREATE INDEX idx_resource_views_viewed_at   ON resource_views(viewed_at);

-- AI Metadata
CREATE INDEX idx_resource_ai_metadata_resource_id ON resource_ai_metadata(resource_id);

-- User Resource Progress
CREATE INDEX idx_user_resource_progress_user_id     ON user_resource_progress(user_id);
CREATE INDEX idx_user_resource_progress_resource_id ON user_resource_progress(resource_id);

-- Events
CREATE INDEX idx_events_course_id     ON events(course_id);
CREATE INDEX idx_events_event_type_id ON events(event_type_id);
CREATE INDEX idx_events_event_date    ON events(event_date);

-- Syllabi
CREATE INDEX idx_syllabi_event_id ON syllabi(event_id);

-- Syllabus Items
CREATE INDEX idx_syllabus_items_syllabus_id ON syllabus_items(syllabus_id);
CREATE INDEX idx_syllabus_items_sequence    ON syllabus_items(syllabus_id, sequence_no);

-- User Syllabus Progress
CREATE INDEX idx_user_syllabus_progress_user_id          ON user_syllabus_progress(user_id);
CREATE INDEX idx_user_syllabus_progress_syllabus_item_id ON user_syllabus_progress(syllabus_item_id);

-- Suggestions
CREATE INDEX idx_suggestions_owner_id    ON suggestions(owner_id);
CREATE INDEX idx_suggestions_syllabus_id ON suggestions(syllabus_id);
CREATE INDEX idx_suggestions_status      ON suggestions(status);

-- Suggestion Resources
CREATE INDEX idx_suggestion_resources_suggestion_id ON suggestion_resources(suggestion_id);
CREATE INDEX idx_suggestion_resources_resource_id   ON suggestion_resources(resource_id);

-- Reward Events
CREATE INDEX idx_reward_events_user_id                   ON reward_events(user_id);
CREATE INDEX idx_reward_events_action                    ON reward_events(action);
CREATE INDEX idx_reward_events_rewarded_resource_id      ON reward_events(rewarded_resource_id)      WHERE rewarded_resource_id      IS NOT NULL;
CREATE INDEX idx_reward_events_rewarded_syllabus_item_id ON reward_events(rewarded_syllabus_item_id) WHERE rewarded_syllabus_item_id IS NOT NULL;
CREATE INDEX idx_reward_events_rewarded_badge_id         ON reward_events(rewarded_badge_id)         WHERE rewarded_badge_id         IS NOT NULL;
CREATE INDEX idx_reward_events_rewarded_suggestion_id    ON reward_events(rewarded_suggestion_id)    WHERE rewarded_suggestion_id    IS NOT NULL;

