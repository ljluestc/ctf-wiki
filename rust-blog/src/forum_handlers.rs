use crate::{
    models::{
        CreateCategory, UpdateCategory, CreateTopic, CreateReply, UpdateReply,
        Claims, TopicWithDetails, CategoryWithStats, ReplyWithDetails
    },
    templates::{ForumIndexTemplate, CategoryTemplate, TopicTemplate, CreateTopicTemplate},
    AppState,
};
use axum::{
    extract::{Path, Query, State, ConnectInfo},
    http::StatusCode,
    response::{Html, IntoResponse},
    Extension, Json,
};
use askama::Template;
use serde::Deserialize;
use std::net::SocketAddr;
use uuid::Uuid;

#[derive(Deserialize)]
pub struct TopicQuery {
    pub page: Option<u64>,
    pub limit: Option<i64>,
    pub category: Option<Uuid>,
}

#[derive(Deserialize)]
pub struct ReplyQuery {
    pub page: Option<u64>,
    pub limit: Option<i64>,
}

// Forum index page
pub async fn forum_index(State(state): State<AppState>) -> impl IntoResponse {
    match state.db.list_categories().await {
        Ok(categories) => {
            let template = ForumIndexTemplate { categories };
            Html(template.render().unwrap_or_else(|_| "Error rendering template".to_string()))
        }
        Err(_) => (StatusCode::INTERNAL_SERVER_ERROR, "Database error").into_response(),
    }
}

// Category page showing topics
pub async fn category_page(
    State(state): State<AppState>,
    Path(category_id): Path<Uuid>,
    Query(params): Query<TopicQuery>,
) -> impl IntoResponse {
    let page = params.page.unwrap_or(1);
    let limit = params.limit.unwrap_or(20);
    let offset = (page - 1) * limit as u64;

    match state.db.get_category(category_id).await {
        Ok(Some(category)) => {
            match state.db.list_topics(Some(category_id), Some(limit), Some(offset as i64)).await {
                Ok(topics) => {
                    let template = CategoryTemplate {
                        category,
                        topics,
                        current_page: page,
                        has_next: topics.len() == limit as usize,
                    };
                    Html(template.render().unwrap_or_else(|_| "Error rendering template".to_string()))
                }
                Err(_) => (StatusCode::INTERNAL_SERVER_ERROR, "Database error").into_response(),
            }
        }
        Ok(None) => (StatusCode::NOT_FOUND, "Category not found").into_response(),
        Err(_) => (StatusCode::INTERNAL_SERVER_ERROR, "Database error").into_response(),
    }
}

// Topic page showing replies
pub async fn topic_page(
    State(state): State<AppState>,
    Path(slug): Path<String>,
    Query(params): Query<ReplyQuery>,
    ConnectInfo(addr): ConnectInfo<SocketAddr>,
) -> impl IntoResponse {
    let page = params.page.unwrap_or(1);
    let limit = params.limit.unwrap_or(20);
    let offset = (page - 1) * limit as u64;

    match state.db.get_topic_by_slug(&slug).await {
        Ok(Some(topic)) => {
            // Track view
            let _ = state.db.increment_topic_views(
                topic.topic.id,
                None, // TODO: Get user ID from session/auth
                &addr.ip().to_string()
            ).await;

            match state.db.list_replies(topic.topic.id, Some(limit), Some(offset as i64)).await {
                Ok(replies) => {
                    let template = TopicTemplate {
                        topic,
                        replies,
                        current_page: page,
                        has_next: replies.len() == limit as usize,
                    };
                    Html(template.render().unwrap_or_else(|_| "Error rendering template".to_string()))
                }
                Err(_) => (StatusCode::INTERNAL_SERVER_ERROR, "Database error").into_response(),
            }
        }
        Ok(None) => (StatusCode::NOT_FOUND, "Topic not found").into_response(),
        Err(_) => (StatusCode::INTERNAL_SERVER_ERROR, "Database error").into_response(),
    }
}

// Create topic page
pub async fn create_topic_page(
    State(state): State<AppState>,
    Query(params): Query<TopicQuery>,
) -> impl IntoResponse {
    match state.db.list_categories().await {
        Ok(categories) => {
            let template = CreateTopicTemplate {
                categories,
                selected_category: params.category,
            };
            Html(template.render().unwrap_or_else(|_| "Error rendering template".to_string()))
        }
        Err(_) => (StatusCode::INTERNAL_SERVER_ERROR, "Database error").into_response(),
    }
}

// API Endpoints

// Categories API
pub async fn api_list_categories(State(state): State<AppState>) -> impl IntoResponse {
    match state.db.list_categories().await {
        Ok(categories) => Json(categories).into_response(),
        Err(_) => (StatusCode::INTERNAL_SERVER_ERROR, "Database error").into_response(),
    }
}

pub async fn api_create_category(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Json(category): Json<CreateCategory>,
) -> impl IntoResponse {
    // Only admins can create categories
    if !matches!(claims.role, crate::models::UserRole::Admin) {
        return (StatusCode::FORBIDDEN, "Admin access required").into_response();
    }

    match state.db.create_category(category).await {
        Ok(created_category) => (StatusCode::CREATED, Json(created_category)).into_response(),
        Err(_) => (StatusCode::INTERNAL_SERVER_ERROR, "Failed to create category").into_response(),
    }
}

pub async fn api_get_category(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> impl IntoResponse {
    match state.db.get_category(id).await {
        Ok(Some(category)) => Json(category).into_response(),
        Ok(None) => (StatusCode::NOT_FOUND, "Category not found").into_response(),
        Err(_) => (StatusCode::INTERNAL_SERVER_ERROR, "Database error").into_response(),
    }
}

// Topics API
pub async fn api_list_topics(
    State(state): State<AppState>,
    Query(params): Query<TopicQuery>,
) -> impl IntoResponse {
    let page = params.page.unwrap_or(1);
    let limit = params.limit.unwrap_or(20);
    let offset = (page - 1) * limit as u64;

    match state.db.list_topics(params.category, Some(limit), Some(offset as i64)).await {
        Ok(topics) => Json(topics).into_response(),
        Err(_) => (StatusCode::INTERNAL_SERVER_ERROR, "Database error").into_response(),
    }
}

pub async fn api_create_topic(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Json(topic): Json<CreateTopic>,
) -> impl IntoResponse {
    let user_id = match claims.sub.parse::<Uuid>() {
        Ok(id) => id,
        Err(_) => return (StatusCode::BAD_REQUEST, "Invalid user ID").into_response(),
    };

    match state.db.create_topic(topic, user_id).await {
        Ok(created_topic) => (StatusCode::CREATED, Json(created_topic)).into_response(),
        Err(_) => (StatusCode::INTERNAL_SERVER_ERROR, "Failed to create topic").into_response(),
    }
}

pub async fn api_get_topic(
    State(state): State<AppState>,
    Path(slug): Path<String>,
    ConnectInfo(addr): ConnectInfo<SocketAddr>,
) -> impl IntoResponse {
    match state.db.get_topic_by_slug(&slug).await {
        Ok(Some(topic)) => {
            // Track view
            let _ = state.db.increment_topic_views(
                topic.topic.id,
                None, // TODO: Get user ID from session/auth
                &addr.ip().to_string()
            ).await;

            Json(topic).into_response()
        }
        Ok(None) => (StatusCode::NOT_FOUND, "Topic not found").into_response(),
        Err(_) => (StatusCode::INTERNAL_SERVER_ERROR, "Database error").into_response(),
    }
}

// Replies API
pub async fn api_list_replies(
    State(state): State<AppState>,
    Path(topic_id): Path<Uuid>,
    Query(params): Query<ReplyQuery>,
) -> impl IntoResponse {
    let page = params.page.unwrap_or(1);
    let limit = params.limit.unwrap_or(20);
    let offset = (page - 1) * limit as u64;

    match state.db.list_replies(topic_id, Some(limit), Some(offset as i64)).await {
        Ok(replies) => Json(replies).into_response(),
        Err(_) => (StatusCode::INTERNAL_SERVER_ERROR, "Database error").into_response(),
    }
}

pub async fn api_create_reply(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(topic_id): Path<Uuid>,
    Json(reply): Json<CreateReply>,
) -> impl IntoResponse {
    let user_id = match claims.sub.parse::<Uuid>() {
        Ok(id) => id,
        Err(_) => return (StatusCode::BAD_REQUEST, "Invalid user ID").into_response(),
    };

    match state.db.create_reply(topic_id, reply, user_id).await {
        Ok(created_reply) => (StatusCode::CREATED, Json(created_reply)).into_response(),
        Err(_) => (StatusCode::INTERNAL_SERVER_ERROR, "Failed to create reply").into_response(),
    }
}

// User profile API
pub async fn api_get_user_profile(
    State(state): State<AppState>,
    Path(user_id): Path<Uuid>,
) -> impl IntoResponse {
    match state.db.get_user_profile(user_id).await {
        Ok(Some(profile)) => Json(profile).into_response(),
        Ok(None) => (StatusCode::NOT_FOUND, "User profile not found").into_response(),
        Err(_) => (StatusCode::INTERNAL_SERVER_ERROR, "Database error").into_response(),
    }
}