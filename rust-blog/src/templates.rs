use crate::models::{Post, Category, TopicWithDetails, ReplyWithDetails, CategoryWithStats};
use askama::Template;
use uuid::Uuid;

#[derive(Template)]
#[template(path = "index.html")]
pub struct IndexTemplate {
    pub posts: Vec<Post>,
}

#[derive(Template)]
#[template(path = "post.html")]
pub struct PostTemplate {
    pub post: Post,
}

#[derive(Template)]
#[template(path = "admin.html")]
pub struct AdminTemplate {}

// Forum Templates

#[derive(Template)]
#[template(path = "forum/index.html")]
pub struct ForumIndexTemplate {
    pub categories: Vec<CategoryWithStats>,
}

#[derive(Template)]
#[template(path = "forum/category.html")]
pub struct CategoryTemplate {
    pub category: Category,
    pub topics: Vec<TopicWithDetails>,
    pub current_page: u64,
    pub has_next: bool,
}

#[derive(Template)]
#[template(path = "forum/topic.html")]
pub struct TopicTemplate {
    pub topic: TopicWithDetails,
    pub replies: Vec<ReplyWithDetails>,
    pub current_page: u64,
    pub has_next: bool,
}

#[derive(Template)]
#[template(path = "forum/create_topic.html")]
pub struct CreateTopicTemplate {
    pub categories: Vec<CategoryWithStats>,
    pub selected_category: Option<Uuid>,
}