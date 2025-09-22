-- Forum Database Schema
-- Similar to Elastic Discuss forum structure

-- Users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    display_name VARCHAR(100),
    avatar_url VARCHAR(500),
    bio TEXT,
    reputation INTEGER DEFAULT 0,
    is_admin BOOLEAN DEFAULT FALSE,
    is_moderator BOOLEAN DEFAULT FALSE,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_seen_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Categories table (like Elasticsearch, Observability, Security)
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    color VARCHAR(7) DEFAULT '#0066CC',
    icon VARCHAR(50),
    parent_id INTEGER REFERENCES categories(id),
    sort_order INTEGER DEFAULT 0,
    is_private BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Topics/Threads table
CREATE TABLE topics (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    category_id INTEGER REFERENCES categories(id) ON DELETE CASCADE,
    is_pinned BOOLEAN DEFAULT FALSE,
    is_locked BOOLEAN DEFAULT FALSE,
    is_solved BOOLEAN DEFAULT FALSE,
    view_count INTEGER DEFAULT 0,
    reply_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_reply_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_reply_user_id INTEGER REFERENCES users(id)
);

-- Posts table (original post + replies)
CREATE TABLE posts (
    id SERIAL PRIMARY KEY,
    topic_id INTEGER REFERENCES topics(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    raw_content TEXT NOT NULL,
    is_solution BOOLEAN DEFAULT FALSE,
    like_count INTEGER DEFAULT 0,
    reply_to_post_id INTEGER REFERENCES posts(id),
    post_number INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    edited_at TIMESTAMP,
    edited_by_user_id INTEGER REFERENCES users(id)
);

-- Post likes/votes
CREATE TABLE post_likes (
    id SERIAL PRIMARY KEY,
    post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(post_id, user_id)
);

-- Topic views tracking
CREATE TABLE topic_views (
    id SERIAL PRIMARY KEY,
    topic_id INTEGER REFERENCES topics(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    ip_address INET,
    viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(topic_id, user_id)
);

-- User notifications
CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- 'reply', 'mention', 'like', 'solution'
    title VARCHAR(255) NOT NULL,
    content TEXT,
    topic_id INTEGER REFERENCES topics(id) ON DELETE CASCADE,
    post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
    from_user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Search index table for full-text search
CREATE TABLE search_index (
    id SERIAL PRIMARY KEY,
    topic_id INTEGER REFERENCES topics(id) ON DELETE CASCADE,
    post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
    content_vector tsvector,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tags for topics
CREATE TABLE tags (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    color VARCHAR(7) DEFAULT '#999999',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Topic tags junction table
CREATE TABLE topic_tags (
    topic_id INTEGER REFERENCES topics(id) ON DELETE CASCADE,
    tag_id INTEGER REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (topic_id, tag_id)
);

-- Indexes for performance
CREATE INDEX idx_topics_category_id ON topics(category_id);
CREATE INDEX idx_topics_user_id ON topics(user_id);
CREATE INDEX idx_topics_created_at ON topics(created_at DESC);
CREATE INDEX idx_topics_last_reply_at ON topics(last_reply_at DESC);
CREATE INDEX idx_posts_topic_id ON posts(topic_id);
CREATE INDEX idx_posts_user_id ON posts(user_id);
CREATE INDEX idx_posts_created_at ON posts(created_at);
CREATE INDEX idx_search_content_vector ON search_index USING gin(content_vector);
CREATE INDEX idx_notifications_user_id_unread ON notifications(user_id, is_read);

-- Full-text search setup
CREATE INDEX idx_search_content ON search_index USING gin(content_vector);

-- Sample data
INSERT INTO categories (name, slug, description, color, icon) VALUES
('General Discussion', 'general', 'General forum discussions and community chat', '#0066CC', 'chat'),
('Development', 'development', 'Software development discussions and help', '#28a745', 'code'),
('Security', 'security', 'Security-related topics and CTF discussions', '#dc3545', 'shield'),
('Tutorials', 'tutorials', 'Tutorials and learning resources', '#ffc107', 'book'),
('Support', 'support', 'Technical support and troubleshooting', '#6f42c1', 'help-circle');