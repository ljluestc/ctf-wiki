-- Forum Tables Migration

-- Categories table
CREATE TABLE categories (
    id UUID PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT NOT NULL,
    color VARCHAR(7) NOT NULL DEFAULT '#3B82F6',
    icon VARCHAR(50),
    sort_order INTEGER NOT NULL DEFAULT 0,
    topics_count BIGINT NOT NULL DEFAULT 0,
    posts_count BIGINT NOT NULL DEFAULT 0,
    last_post_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Topics table
CREATE TABLE topics (
    id UUID PRIMARY KEY,
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    views BIGINT NOT NULL DEFAULT 0,
    replies_count BIGINT NOT NULL DEFAULT 0,
    is_pinned BOOLEAN NOT NULL DEFAULT false,
    is_locked BOOLEAN NOT NULL DEFAULT false,
    is_solved BOOLEAN NOT NULL DEFAULT false,
    last_reply_at TIMESTAMP WITH TIME ZONE,
    last_reply_user_id UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Replies table
CREATE TABLE replies (
    id UUID PRIMARY KEY,
    topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_solution BOOLEAN NOT NULL DEFAULT false,
    likes_count BIGINT NOT NULL DEFAULT 0,
    reply_to_id UUID REFERENCES replies(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- User profiles table
CREATE TABLE user_profiles (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    display_name VARCHAR(100) NOT NULL,
    bio TEXT,
    avatar_url VARCHAR(500),
    location VARCHAR(100),
    website VARCHAR(500),
    reputation BIGINT NOT NULL DEFAULT 0,
    topics_count BIGINT NOT NULL DEFAULT 0,
    replies_count BIGINT NOT NULL DEFAULT 0,
    likes_given BIGINT NOT NULL DEFAULT 0,
    likes_received BIGINT NOT NULL DEFAULT 0,
    last_seen_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Likes table
CREATE TABLE likes (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reply_id UUID NOT NULL REFERENCES replies(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, reply_id)
);

-- Topic views table (for tracking unique views)
CREATE TABLE topic_views (
    id UUID PRIMARY KEY,
    topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    ip_address INET NOT NULL,
    viewed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_categories_sort_order ON categories(sort_order);
CREATE INDEX idx_topics_category_id ON topics(category_id);
CREATE INDEX idx_topics_user_id ON topics(user_id);
CREATE INDEX idx_topics_last_reply_at ON topics(last_reply_at DESC);
CREATE INDEX idx_topics_created_at ON topics(created_at DESC);
CREATE INDEX idx_topics_slug ON topics(slug);
CREATE INDEX idx_topics_pinned_created ON topics(is_pinned DESC, created_at DESC);

CREATE INDEX idx_replies_topic_id ON replies(topic_id);
CREATE INDEX idx_replies_user_id ON replies(user_id);
CREATE INDEX idx_replies_created_at ON replies(created_at);
CREATE INDEX idx_replies_reply_to_id ON replies(reply_to_id);

CREATE INDEX idx_likes_reply_id ON likes(reply_id);
CREATE INDEX idx_likes_user_id ON likes(user_id);

CREATE INDEX idx_topic_views_topic_id ON topic_views(topic_id);
CREATE INDEX idx_topic_views_user_id ON topic_views(user_id);
CREATE INDEX idx_topic_views_ip_address ON topic_views(ip_address);

-- Add unique constraint for topic views (prevent duplicate views from same user/IP)
CREATE UNIQUE INDEX idx_topic_views_unique ON topic_views(topic_id, COALESCE(user_id, '00000000-0000-0000-0000-000000000000'::uuid), ip_address);

CREATE INDEX idx_user_profiles_display_name ON user_profiles(display_name);
CREATE INDEX idx_user_profiles_reputation ON user_profiles(reputation DESC);
CREATE INDEX idx_user_profiles_last_seen ON user_profiles(last_seen_at DESC);

-- Functions to update counters

-- Function to update topic counters
CREATE OR REPLACE FUNCTION update_topic_counters()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Update topic reply count and last reply info
        UPDATE topics
        SET replies_count = replies_count + 1,
            last_reply_at = NEW.created_at,
            last_reply_user_id = NEW.user_id,
            updated_at = NOW()
        WHERE id = NEW.topic_id;

        -- Update category post count
        UPDATE categories
        SET posts_count = posts_count + 1,
            last_post_at = NEW.created_at
        WHERE id = (SELECT category_id FROM topics WHERE id = NEW.topic_id);

        -- Update user profile
        UPDATE user_profiles
        SET replies_count = replies_count + 1,
            updated_at = NOW()
        WHERE user_id = NEW.user_id;

        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        -- Update topic reply count
        UPDATE topics
        SET replies_count = replies_count - 1
        WHERE id = OLD.topic_id;

        -- Update category post count
        UPDATE categories
        SET posts_count = posts_count - 1
        WHERE id = (SELECT category_id FROM topics WHERE id = OLD.topic_id);

        -- Update user profile
        UPDATE user_profiles
        SET replies_count = replies_count - 1,
            updated_at = NOW()
        WHERE user_id = OLD.user_id;

        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Function to update category counters when topics are added/removed
CREATE OR REPLACE FUNCTION update_category_counters()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE categories
        SET topics_count = topics_count + 1
        WHERE id = NEW.category_id;

        -- Update user profile
        UPDATE user_profiles
        SET topics_count = topics_count + 1,
            updated_at = NOW()
        WHERE user_id = NEW.user_id;

        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE categories
        SET topics_count = topics_count - 1
        WHERE id = OLD.category_id;

        -- Update user profile
        UPDATE user_profiles
        SET topics_count = topics_count - 1,
            updated_at = NOW()
        WHERE user_id = OLD.user_id;

        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Function to update like counters
CREATE OR REPLACE FUNCTION update_like_counters()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Update reply likes count
        UPDATE replies
        SET likes_count = likes_count + 1
        WHERE id = NEW.reply_id;

        -- Update user profiles
        UPDATE user_profiles
        SET likes_given = likes_given + 1,
            updated_at = NOW()
        WHERE user_id = NEW.user_id;

        UPDATE user_profiles
        SET likes_received = likes_received + 1,
            reputation = reputation + 1,
            updated_at = NOW()
        WHERE user_id = (SELECT user_id FROM replies WHERE id = NEW.reply_id);

        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        -- Update reply likes count
        UPDATE replies
        SET likes_count = likes_count - 1
        WHERE id = OLD.reply_id;

        -- Update user profiles
        UPDATE user_profiles
        SET likes_given = likes_given - 1,
            updated_at = NOW()
        WHERE user_id = OLD.user_id;

        UPDATE user_profiles
        SET likes_received = likes_received - 1,
            reputation = reputation - 1,
            updated_at = NOW()
        WHERE user_id = (SELECT user_id FROM replies WHERE id = OLD.reply_id);

        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER trigger_update_topic_counters
    AFTER INSERT OR DELETE ON replies
    FOR EACH ROW
    EXECUTE FUNCTION update_topic_counters();

CREATE TRIGGER trigger_update_category_counters
    AFTER INSERT OR DELETE ON topics
    FOR EACH ROW
    EXECUTE FUNCTION update_category_counters();

CREATE TRIGGER trigger_update_like_counters
    AFTER INSERT OR DELETE ON likes
    FOR EACH ROW
    EXECUTE FUNCTION update_like_counters();

-- Create default categories
INSERT INTO categories (id, name, description, color, icon, sort_order) VALUES
(gen_random_uuid(), 'General Discussion', 'General topics and community discussions', '#3B82F6', '💬', 1),
(gen_random_uuid(), 'Help & Support', 'Get help with technical issues and questions', '#10B981', '🆘', 2),
(gen_random_uuid(), 'Feature Requests', 'Suggest new features and improvements', '#8B5CF6', '💡', 3),
(gen_random_uuid(), 'Bug Reports', 'Report bugs and technical issues', '#EF4444', '🐛', 4),
(gen_random_uuid(), 'Announcements', 'Official announcements and updates', '#F59E0B', '📢', 5);

-- Create user profiles for existing users
INSERT INTO user_profiles (user_id, display_name, created_at, updated_at)
SELECT id, username, created_at, created_at FROM users
ON CONFLICT (user_id) DO NOTHING;