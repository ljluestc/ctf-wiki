use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct Post {
    pub id: Uuid,
    pub title: String,
    pub content: String,
    pub summary: Option<String>,
    pub author: String,
    pub published: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub tags: Vec<String>,
}

// Forum Models

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct Category {
    pub id: Uuid,
    pub name: String,
    pub description: String,
    pub color: String,
    pub icon: Option<String>,
    pub sort_order: i32,
    pub topics_count: i64,
    pub posts_count: i64,
    pub last_post_at: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct Topic {
    pub id: Uuid,
    pub category_id: Uuid,
    pub title: String,
    pub slug: String,
    pub user_id: Uuid,
    pub views: i64,
    pub replies_count: i64,
    pub is_pinned: bool,
    pub is_locked: bool,
    pub is_solved: bool,
    pub last_reply_at: Option<DateTime<Utc>>,
    pub last_reply_user_id: Option<Uuid>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct Reply {
    pub id: Uuid,
    pub topic_id: Uuid,
    pub user_id: Uuid,
    pub content: String,
    pub is_solution: bool,
    pub likes_count: i64,
    pub reply_to_id: Option<Uuid>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct UserProfile {
    pub user_id: Uuid,
    pub display_name: String,
    pub bio: Option<String>,
    pub avatar_url: Option<String>,
    pub location: Option<String>,
    pub website: Option<String>,
    pub reputation: i64,
    pub topics_count: i64,
    pub replies_count: i64,
    pub likes_given: i64,
    pub likes_received: i64,
    pub last_seen_at: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct Like {
    pub id: Uuid,
    pub user_id: Uuid,
    pub reply_id: Uuid,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct TopicView {
    pub id: Uuid,
    pub topic_id: Uuid,
    pub user_id: Option<Uuid>,
    pub ip_address: String,
    pub viewed_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize)]
pub struct CreatePost {
    pub title: String,
    pub content: String,
    pub summary: Option<String>,
    pub author: String,
    pub published: Option<bool>,
    pub tags: Option<Vec<String>>,
}

#[derive(Debug, Deserialize)]
pub struct UpdatePost {
    pub title: Option<String>,
    pub content: Option<String>,
    pub summary: Option<String>,
    pub published: Option<bool>,
    pub tags: Option<Vec<String>>,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct User {
    pub id: Uuid,
    pub username: String,
    pub email: String,
    pub password_hash: String,
    pub role: UserRole,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::Type)]
#[sqlx(type_name = "user_role", rename_all = "lowercase")]
pub enum UserRole {
    Admin,
    Editor,
    Viewer,
}

#[derive(Debug, Deserialize)]
pub struct CreateUser {
    pub username: String,
    pub email: String,
    pub password: String,
    pub role: Option<UserRole>,
}

#[derive(Debug, Deserialize)]
pub struct LoginRequest {
    pub username: String,
    pub password: String,
}

#[derive(Debug, Serialize)]
pub struct AuthResponse {
    pub token: String,
    pub user: UserInfo,
}

#[derive(Debug, Serialize)]
pub struct UserInfo {
    pub id: Uuid,
    pub username: String,
    pub email: String,
    pub role: UserRole,
}

impl From<User> for UserInfo {
    fn from(user: User) -> Self {
        Self {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
        }
    }
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Claims {
    pub sub: String,
    pub username: String,
    pub role: UserRole,
    pub exp: usize,
}

// Forum Request/Response Models

#[derive(Debug, Deserialize)]
pub struct CreateCategory {
    pub name: String,
    pub description: String,
    pub color: String,
    pub icon: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateCategory {
    pub name: Option<String>,
    pub description: Option<String>,
    pub color: Option<String>,
    pub icon: Option<String>,
    pub sort_order: Option<i32>,
}

#[derive(Debug, Deserialize)]
pub struct CreateTopic {
    pub category_id: Uuid,
    pub title: String,
    pub content: String,
}

#[derive(Debug, Deserialize)]
pub struct UpdateTopic {
    pub title: Option<String>,
    pub is_pinned: Option<bool>,
    pub is_locked: Option<bool>,
}

#[derive(Debug, Deserialize)]
pub struct CreateReply {
    pub content: String,
    pub reply_to_id: Option<Uuid>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateReply {
    pub content: String,
}

#[derive(Debug, Deserialize)]
pub struct UpdateUserProfile {
    pub display_name: Option<String>,
    pub bio: Option<String>,
    pub location: Option<String>,
    pub website: Option<String>,
}

// Extended response models with related data

#[derive(Debug, Serialize)]
pub struct TopicWithDetails {
    #[serde(flatten)]
    pub topic: Topic,
    pub category: Category,
    pub user: UserInfo,
    pub last_reply_user: Option<UserInfo>,
}

#[derive(Debug, Serialize)]
pub struct ReplyWithDetails {
    #[serde(flatten)]
    pub reply: Reply,
    pub user: UserInfo,
    pub reply_to_user: Option<UserInfo>,
}

#[derive(Debug, Serialize)]
pub struct CategoryWithStats {
    #[serde(flatten)]
    pub category: Category,
    pub latest_topic: Option<TopicWithDetails>,
}

#[derive(Debug, Serialize)]
pub struct UserStats {
    pub topics_created: i64,
    pub replies_posted: i64,
    pub likes_received: i64,
    pub reputation: i64,
    pub join_date: DateTime<Utc>,
    pub last_seen: Option<DateTime<Utc>>,
}

#[derive(Debug, Serialize)]
pub struct ForumStats {
    pub total_topics: i64,
    pub total_replies: i64,
    pub total_users: i64,
    pub active_users_today: i64,
}