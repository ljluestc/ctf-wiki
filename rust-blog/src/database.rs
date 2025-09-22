use crate::models::{
    Post, CreatePost, UpdatePost, User, CreateUser, UserRole,
    Category, CreateCategory, UpdateCategory,
    Topic, CreateTopic, UpdateTopic, TopicWithDetails,
    Reply, CreateReply, UpdateReply, ReplyWithDetails,
    UserProfile, UpdateUserProfile, Like, TopicView,
    CategoryWithStats, UserStats, ForumStats, UserInfo
};
use anyhow::Result;
use chrono::Utc;
use sqlx::{PgPool, Row};
use uuid::Uuid;

pub struct Database {
    pool: PgPool,
}

impl Database {
    pub async fn new(database_url: &str) -> Result<Self> {
        let pool = PgPool::connect(database_url).await?;
        Ok(Self { pool })
    }

    pub async fn migrate(&self) -> Result<()> {
        sqlx::migrate!("./migrations").run(&self.pool).await?;
        Ok(())
    }

    // Post operations
    pub async fn create_post(&self, post: CreatePost) -> Result<Post> {
        let id = Uuid::new_v4();
        let now = Utc::now();
        let published = post.published.unwrap_or(false);
        let tags = post.tags.unwrap_or_default();

        let post = sqlx::query_as!(
            Post,
            r#"
            INSERT INTO posts (id, title, content, summary, author, published, created_at, updated_at, tags)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING id, title, content, summary, author, published, created_at, updated_at, tags
            "#,
            id,
            post.title,
            post.content,
            post.summary,
            post.author,
            published,
            now,
            now,
            &tags
        )
        .fetch_one(&self.pool)
        .await?;

        Ok(post)
    }

    pub async fn get_post(&self, id: Uuid) -> Result<Option<Post>> {
        let post = sqlx::query_as!(
            Post,
            "SELECT id, title, content, summary, author, published, created_at, updated_at, tags FROM posts WHERE id = $1",
            id
        )
        .fetch_optional(&self.pool)
        .await?;

        Ok(post)
    }

    pub async fn list_posts(&self, published_only: bool, limit: Option<i64>, offset: Option<i64>) -> Result<Vec<Post>> {
        let limit = limit.unwrap_or(10);
        let offset = offset.unwrap_or(0);

        let posts = if published_only {
            sqlx::query_as!(
                Post,
                "SELECT id, title, content, summary, author, published, created_at, updated_at, tags
                 FROM posts WHERE published = true
                 ORDER BY created_at DESC LIMIT $1 OFFSET $2",
                limit,
                offset
            )
            .fetch_all(&self.pool)
            .await?
        } else {
            sqlx::query_as!(
                Post,
                "SELECT id, title, content, summary, author, published, created_at, updated_at, tags
                 FROM posts ORDER BY created_at DESC LIMIT $1 OFFSET $2",
                limit,
                offset
            )
            .fetch_all(&self.pool)
            .await?
        };

        Ok(posts)
    }

    pub async fn update_post(&self, id: Uuid, update: UpdatePost) -> Result<Option<Post>> {
        let existing_post = self.get_post(id).await?;
        let Some(mut post) = existing_post else {
            return Ok(None);
        };

        if let Some(title) = update.title {
            post.title = title;
        }
        if let Some(content) = update.content {
            post.content = content;
        }
        if let Some(summary) = update.summary {
            post.summary = Some(summary);
        }
        if let Some(published) = update.published {
            post.published = published;
        }
        if let Some(tags) = update.tags {
            post.tags = tags;
        }
        post.updated_at = Utc::now();

        let updated_post = sqlx::query_as!(
            Post,
            r#"
            UPDATE posts
            SET title = $1, content = $2, summary = $3, published = $4, updated_at = $5, tags = $6
            WHERE id = $7
            RETURNING id, title, content, summary, author, published, created_at, updated_at, tags
            "#,
            post.title,
            post.content,
            post.summary,
            post.published,
            post.updated_at,
            &post.tags,
            id
        )
        .fetch_one(&self.pool)
        .await?;

        Ok(Some(updated_post))
    }

    pub async fn delete_post(&self, id: Uuid) -> Result<bool> {
        let result = sqlx::query!("DELETE FROM posts WHERE id = $1", id)
            .execute(&self.pool)
            .await?;

        Ok(result.rows_affected() > 0)
    }

    // User operations
    pub async fn create_user(&self, user: CreateUser) -> Result<User> {
        let id = Uuid::new_v4();
        let now = Utc::now();
        let role = user.role.unwrap_or(UserRole::Viewer);
        let password_hash = bcrypt::hash(&user.password, bcrypt::DEFAULT_COST)?;

        let user = sqlx::query_as!(
            User,
            r#"
            INSERT INTO users (id, username, email, password_hash, role, created_at)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING id, username, email, password_hash, role as "role: UserRole", created_at
            "#,
            id,
            user.username,
            user.email,
            password_hash,
            role as UserRole,
            now
        )
        .fetch_one(&self.pool)
        .await?;

        Ok(user)
    }

    pub async fn get_user_by_username(&self, username: &str) -> Result<Option<User>> {
        let user = sqlx::query_as!(
            User,
            r#"SELECT id, username, email, password_hash, role as "role: UserRole", created_at
               FROM users WHERE username = $1"#,
            username
        )
        .fetch_optional(&self.pool)
        .await?;

        Ok(user)
    }

    pub async fn get_user_by_id(&self, id: Uuid) -> Result<Option<User>> {
        let user = sqlx::query_as!(
            User,
            r#"SELECT id, username, email, password_hash, role as "role: UserRole", created_at
               FROM users WHERE id = $1"#,
            id
        )
        .fetch_optional(&self.pool)
        .await?;

        Ok(user)
    }

    // Forum operations

    // Category operations
    pub async fn create_category(&self, category: CreateCategory) -> Result<Category> {
        let id = Uuid::new_v4();
        let now = Utc::now();

        let category = sqlx::query_as!(
            Category,
            r#"
            INSERT INTO categories (id, name, description, color, icon, created_at)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING id, name, description, color, icon, sort_order, topics_count, posts_count, last_post_at, created_at
            "#,
            id,
            category.name,
            category.description,
            category.color,
            category.icon,
            now
        )
        .fetch_one(&self.pool)
        .await?;

        Ok(category)
    }

    pub async fn list_categories(&self) -> Result<Vec<CategoryWithStats>> {
        let categories = sqlx::query_as!(
            Category,
            "SELECT id, name, description, color, icon, sort_order, topics_count, posts_count, last_post_at, created_at
             FROM categories ORDER BY sort_order, name"
        )
        .fetch_all(&self.pool)
        .await?;

        let mut categories_with_stats = Vec::new();
        for category in categories {
            // Get latest topic for this category
            let latest_topic = self.get_latest_topic_for_category(category.id).await?;

            categories_with_stats.push(CategoryWithStats {
                category,
                latest_topic,
            });
        }

        Ok(categories_with_stats)
    }

    pub async fn get_category(&self, id: Uuid) -> Result<Option<Category>> {
        let category = sqlx::query_as!(
            Category,
            "SELECT id, name, description, color, icon, sort_order, topics_count, posts_count, last_post_at, created_at
             FROM categories WHERE id = $1",
            id
        )
        .fetch_optional(&self.pool)
        .await?;

        Ok(category)
    }

    async fn get_latest_topic_for_category(&self, category_id: Uuid) -> Result<Option<TopicWithDetails>> {
        let topic = sqlx::query!(
            r#"
            SELECT t.id, t.category_id, t.title, t.slug, t.user_id, t.views, t.replies_count,
                   t.is_pinned, t.is_locked, t.is_solved, t.last_reply_at, t.last_reply_user_id,
                   t.created_at, t.updated_at,
                   c.name as category_name, c.description as category_description,
                   c.color as category_color, c.icon as category_icon, c.sort_order as category_sort_order,
                   c.topics_count as category_topics_count, c.posts_count as category_posts_count,
                   c.last_post_at as category_last_post_at, c.created_at as category_created_at,
                   u.username, u.email, u.role as "role: UserRole"
            FROM topics t
            JOIN categories c ON t.category_id = c.id
            JOIN users u ON t.user_id = u.id
            WHERE t.category_id = $1
            ORDER BY t.created_at DESC
            LIMIT 1
            "#,
            category_id
        )
        .fetch_optional(&self.pool)
        .await?;

        if let Some(row) = topic {
            let topic = Topic {
                id: row.id,
                category_id: row.category_id,
                title: row.title,
                slug: row.slug,
                user_id: row.user_id,
                views: row.views,
                replies_count: row.replies_count,
                is_pinned: row.is_pinned,
                is_locked: row.is_locked,
                is_solved: row.is_solved,
                last_reply_at: row.last_reply_at,
                last_reply_user_id: row.last_reply_user_id,
                created_at: row.created_at,
                updated_at: row.updated_at,
            };

            let category = Category {
                id: row.category_id,
                name: row.category_name,
                description: row.category_description,
                color: row.category_color,
                icon: row.category_icon,
                sort_order: row.category_sort_order,
                topics_count: row.category_topics_count,
                posts_count: row.category_posts_count,
                last_post_at: row.category_last_post_at,
                created_at: row.category_created_at,
            };

            let user = UserInfo {
                id: row.user_id,
                username: row.username,
                email: row.email,
                role: row.role,
            };

            return Ok(Some(TopicWithDetails {
                topic,
                category,
                user,
                last_reply_user: None,
            }));
        }

        Ok(None)
    }

    // Topic operations
    pub async fn create_topic(&self, topic: CreateTopic, user_id: Uuid) -> Result<Topic> {
        let id = Uuid::new_v4();
        let now = Utc::now();
        let slug = self.generate_slug(&topic.title).await?;

        // Start transaction to create topic and first reply
        let mut tx = self.pool.begin().await?;

        let topic = sqlx::query_as!(
            Topic,
            r#"
            INSERT INTO topics (id, category_id, title, slug, user_id, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING id, category_id, title, slug, user_id, views, replies_count,
                      is_pinned, is_locked, is_solved, last_reply_at, last_reply_user_id,
                      created_at, updated_at
            "#,
            id,
            topic.category_id,
            topic.title,
            slug,
            user_id,
            now,
            now
        )
        .fetch_one(&mut *tx)
        .await?;

        // Create the initial post as the first reply
        let reply_id = Uuid::new_v4();
        sqlx::query!(
            "INSERT INTO replies (id, topic_id, user_id, content, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6)",
            reply_id,
            topic.id,
            user_id,
            topic.content,
            now,
            now
        )
        .execute(&mut *tx)
        .await?;

        tx.commit().await?;

        Ok(topic)
    }

    pub async fn list_topics(&self, category_id: Option<Uuid>, limit: Option<i64>, offset: Option<i64>) -> Result<Vec<TopicWithDetails>> {
        let limit = limit.unwrap_or(20);
        let offset = offset.unwrap_or(0);

        let topics = if let Some(cat_id) = category_id {
            sqlx::query!(
                r#"
                SELECT t.id, t.category_id, t.title, t.slug, t.user_id, t.views, t.replies_count,
                       t.is_pinned, t.is_locked, t.is_solved, t.last_reply_at, t.last_reply_user_id,
                       t.created_at, t.updated_at,
                       c.name as category_name, c.description as category_description,
                       c.color as category_color, c.icon as category_icon, c.sort_order as category_sort_order,
                       c.topics_count as category_topics_count, c.posts_count as category_posts_count,
                       c.last_post_at as category_last_post_at, c.created_at as category_created_at,
                       u.username, u.email, u.role as "role: UserRole"
                FROM topics t
                JOIN categories c ON t.category_id = c.id
                JOIN users u ON t.user_id = u.id
                WHERE t.category_id = $1
                ORDER BY t.is_pinned DESC, t.last_reply_at DESC NULLS LAST, t.created_at DESC
                LIMIT $2 OFFSET $3
                "#,
                cat_id,
                limit,
                offset
            )
            .fetch_all(&self.pool)
            .await?
        } else {
            sqlx::query!(
                r#"
                SELECT t.id, t.category_id, t.title, t.slug, t.user_id, t.views, t.replies_count,
                       t.is_pinned, t.is_locked, t.is_solved, t.last_reply_at, t.last_reply_user_id,
                       t.created_at, t.updated_at,
                       c.name as category_name, c.description as category_description,
                       c.color as category_color, c.icon as category_icon, c.sort_order as category_sort_order,
                       c.topics_count as category_topics_count, c.posts_count as category_posts_count,
                       c.last_post_at as category_last_post_at, c.created_at as category_created_at,
                       u.username, u.email, u.role as "role: UserRole"
                FROM topics t
                JOIN categories c ON t.category_id = c.id
                JOIN users u ON t.user_id = u.id
                ORDER BY t.is_pinned DESC, t.last_reply_at DESC NULLS LAST, t.created_at DESC
                LIMIT $1 OFFSET $2
                "#,
                limit,
                offset
            )
            .fetch_all(&self.pool)
            .await?
        };

        let mut result = Vec::new();
        for row in topics {
            let topic = Topic {
                id: row.id,
                category_id: row.category_id,
                title: row.title,
                slug: row.slug,
                user_id: row.user_id,
                views: row.views,
                replies_count: row.replies_count,
                is_pinned: row.is_pinned,
                is_locked: row.is_locked,
                is_solved: row.is_solved,
                last_reply_at: row.last_reply_at,
                last_reply_user_id: row.last_reply_user_id,
                created_at: row.created_at,
                updated_at: row.updated_at,
            };

            let category = Category {
                id: row.category_id,
                name: row.category_name,
                description: row.category_description,
                color: row.category_color,
                icon: row.category_icon,
                sort_order: row.category_sort_order,
                topics_count: row.category_topics_count,
                posts_count: row.category_posts_count,
                last_post_at: row.category_last_post_at,
                created_at: row.category_created_at,
            };

            let user = UserInfo {
                id: row.user_id,
                username: row.username,
                email: row.email,
                role: row.role,
            };

            result.push(TopicWithDetails {
                topic,
                category,
                user,
                last_reply_user: None, // TODO: Fetch last reply user if needed
            });
        }

        Ok(result)
    }

    pub async fn get_topic_by_slug(&self, slug: &str) -> Result<Option<TopicWithDetails>> {
        let row = sqlx::query!(
            r#"
            SELECT t.id, t.category_id, t.title, t.slug, t.user_id, t.views, t.replies_count,
                   t.is_pinned, t.is_locked, t.is_solved, t.last_reply_at, t.last_reply_user_id,
                   t.created_at, t.updated_at,
                   c.name as category_name, c.description as category_description,
                   c.color as category_color, c.icon as category_icon, c.sort_order as category_sort_order,
                   c.topics_count as category_topics_count, c.posts_count as category_posts_count,
                   c.last_post_at as category_last_post_at, c.created_at as category_created_at,
                   u.username, u.email, u.role as "role: UserRole"
            FROM topics t
            JOIN categories c ON t.category_id = c.id
            JOIN users u ON t.user_id = u.id
            WHERE t.slug = $1
            "#,
            slug
        )
        .fetch_optional(&self.pool)
        .await?;

        if let Some(row) = row {
            let topic = Topic {
                id: row.id,
                category_id: row.category_id,
                title: row.title,
                slug: row.slug,
                user_id: row.user_id,
                views: row.views,
                replies_count: row.replies_count,
                is_pinned: row.is_pinned,
                is_locked: row.is_locked,
                is_solved: row.is_solved,
                last_reply_at: row.last_reply_at,
                last_reply_user_id: row.last_reply_user_id,
                created_at: row.created_at,
                updated_at: row.updated_at,
            };

            let category = Category {
                id: row.category_id,
                name: row.category_name,
                description: row.category_description,
                color: row.category_color,
                icon: row.category_icon,
                sort_order: row.category_sort_order,
                topics_count: row.category_topics_count,
                posts_count: row.category_posts_count,
                last_post_at: row.category_last_post_at,
                created_at: row.category_created_at,
            };

            let user = UserInfo {
                id: row.user_id,
                username: row.username,
                email: row.email,
                role: row.role,
            };

            return Ok(Some(TopicWithDetails {
                topic,
                category,
                user,
                last_reply_user: None,
            }));
        }

        Ok(None)
    }

    pub async fn increment_topic_views(&self, topic_id: Uuid, user_id: Option<Uuid>, ip_address: &str) -> Result<()> {
        // Insert view record (will be deduplicated by unique constraints)
        let view_id = Uuid::new_v4();
        let _ = sqlx::query!(
            "INSERT INTO topic_views (id, topic_id, user_id, ip_address, viewed_at)
             VALUES ($1, $2, $3, $4, NOW())
             ON CONFLICT (topic_id, COALESCE(user_id, '00000000-0000-0000-0000-000000000000'::uuid), ip_address) DO NOTHING",
            view_id,
            topic_id,
            user_id,
            ip_address.parse::<std::net::IpAddr>().unwrap()
        )
        .execute(&self.pool)
        .await;

        // Update topic views count
        sqlx::query!(
            "UPDATE topics SET views = views + 1 WHERE id = $1",
            topic_id
        )
        .execute(&self.pool)
        .await?;

        Ok(())
    }

    // Reply operations
    pub async fn create_reply(&self, topic_id: Uuid, reply: CreateReply, user_id: Uuid) -> Result<Reply> {
        let id = Uuid::new_v4();
        let now = Utc::now();

        let reply = sqlx::query_as!(
            Reply,
            r#"
            INSERT INTO replies (id, topic_id, user_id, content, reply_to_id, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING id, topic_id, user_id, content, is_solution, likes_count, reply_to_id, created_at, updated_at
            "#,
            id,
            topic_id,
            user_id,
            reply.content,
            reply.reply_to_id,
            now,
            now
        )
        .fetch_one(&self.pool)
        .await?;

        Ok(reply)
    }

    pub async fn list_replies(&self, topic_id: Uuid, limit: Option<i64>, offset: Option<i64>) -> Result<Vec<ReplyWithDetails>> {
        let limit = limit.unwrap_or(20);
        let offset = offset.unwrap_or(0);

        let replies = sqlx::query!(
            r#"
            SELECT r.id, r.topic_id, r.user_id, r.content, r.is_solution, r.likes_count,
                   r.reply_to_id, r.created_at, r.updated_at,
                   u.username, u.email, u.role as "role: UserRole"
            FROM replies r
            JOIN users u ON r.user_id = u.id
            WHERE r.topic_id = $1
            ORDER BY r.created_at ASC
            LIMIT $2 OFFSET $3
            "#,
            topic_id,
            limit,
            offset
        )
        .fetch_all(&self.pool)
        .await?;

        let mut result = Vec::new();
        for row in replies {
            let reply = Reply {
                id: row.id,
                topic_id: row.topic_id,
                user_id: row.user_id,
                content: row.content,
                is_solution: row.is_solution,
                likes_count: row.likes_count,
                reply_to_id: row.reply_to_id,
                created_at: row.created_at,
                updated_at: row.updated_at,
            };

            let user = UserInfo {
                id: row.user_id,
                username: row.username,
                email: row.email,
                role: row.role,
            };

            result.push(ReplyWithDetails {
                reply,
                user,
                reply_to_user: None, // TODO: Fetch reply-to user if needed
            });
        }

        Ok(result)
    }

    // User profile operations
    pub async fn get_user_profile(&self, user_id: Uuid) -> Result<Option<UserProfile>> {
        let profile = sqlx::query_as!(
            UserProfile,
            "SELECT user_id, display_name, bio, avatar_url, location, website, reputation,
                    topics_count, replies_count, likes_given, likes_received, last_seen_at,
                    created_at, updated_at
             FROM user_profiles WHERE user_id = $1",
            user_id
        )
        .fetch_optional(&self.pool)
        .await?;

        Ok(profile)
    }

    // Helper functions
    async fn generate_slug(&self, title: &str) -> Result<String> {
        let base_slug = title
            .to_lowercase()
            .chars()
            .filter(|c| c.is_alphanumeric() || c.is_whitespace() || *c == '-')
            .collect::<String>()
            .split_whitespace()
            .collect::<Vec<&str>>()
            .join("-");

        let mut slug = base_slug.clone();
        let mut counter = 1;

        while self.slug_exists(&slug).await? {
            slug = format!("{}-{}", base_slug, counter);
            counter += 1;
        }

        Ok(slug)
    }

    async fn slug_exists(&self, slug: &str) -> Result<bool> {
        let exists = sqlx::query!(
            "SELECT EXISTS(SELECT 1 FROM topics WHERE slug = $1)",
            slug
        )
        .fetch_one(&self.pool)
        .await?;

        Ok(exists.exists.unwrap_or(false))
    }
}