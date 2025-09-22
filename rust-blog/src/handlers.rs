use crate::{
    auth::{create_jwt, verify_jwt},
    models::{CreatePost, UpdatePost, LoginRequest, CreateUser, AuthResponse, UserInfo, Claims},
    templates::{IndexTemplate, PostTemplate, AdminTemplate},
    AppState,
};
use axum::{
    extract::{Path, Query, State},
    http::StatusCode,
    response::{Html, IntoResponse},
    Extension, Json,
};
use askama::Template;
use serde::Deserialize;
use std::collections::HashMap;
use uuid::Uuid;

#[derive(Deserialize)]
pub struct ListQuery {
    pub page: Option<u64>,
    pub limit: Option<i64>,
    pub published: Option<bool>,
}

pub async fn index(State(state): State<AppState>) -> impl IntoResponse {
    match state.db.list_posts(true, Some(5), Some(0)).await {
        Ok(posts) => {
            let template = IndexTemplate { posts };
            Html(template.render().unwrap_or_else(|_| "Error rendering template".to_string()))
        }
        Err(_) => (StatusCode::INTERNAL_SERVER_ERROR, "Database error").into_response(),
    }
}

pub async fn list_posts(
    State(state): State<AppState>,
    Query(params): Query<ListQuery>,
) -> impl IntoResponse {
    let page = params.page.unwrap_or(1);
    let limit = params.limit.unwrap_or(10);
    let offset = (page - 1) * limit as u64;

    match state.db.list_posts(true, Some(limit), Some(offset as i64)).await {
        Ok(posts) => Html(format!(
            r#"
            <!DOCTYPE html>
            <html>
            <head>
                <title>Blog Posts</title>
                <link rel="stylesheet" href="/static/style.css">
            </head>
            <body>
                <div class="container">
                    <h1>Blog Posts</h1>
                    {}
                    <div class="navigation">
                        <a href="/">Home</a> | <a href="/admin">Admin</a>
                    </div>
                </div>
            </body>
            </html>
            "#,
            posts.iter()
                .map(|post| format!(
                    r#"
                    <article class="post">
                        <h2><a href="/posts/{}">{}</a></h2>
                        <p class="meta">By {} on {}</p>
                        {}
                        <div class="tags">
                            {}
                        </div>
                    </article>
                    "#,
                    post.id,
                    post.title,
                    post.author,
                    post.created_at.format("%Y-%m-%d %H:%M"),
                    post.summary.as_deref().unwrap_or(""),
                    post.tags.iter()
                        .map(|tag| format!("<span class=\"tag\">{}</span>", tag))
                        .collect::<Vec<_>>()
                        .join(" ")
                ))
                .collect::<Vec<_>>()
                .join("")
        )),
        Err(_) => (StatusCode::INTERNAL_SERVER_ERROR, "Database error").into_response(),
    }
}

pub async fn get_post(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> impl IntoResponse {
    match state.db.get_post(id).await {
        Ok(Some(post)) => {
            let template = PostTemplate { post };
            Html(template.render().unwrap_or_else(|_| "Error rendering template".to_string()))
        }
        Ok(None) => (StatusCode::NOT_FOUND, "Post not found").into_response(),
        Err(_) => (StatusCode::INTERNAL_SERVER_ERROR, "Database error").into_response(),
    }
}

pub async fn admin_panel() -> impl IntoResponse {
    let template = AdminTemplate {};
    Html(template.render().unwrap_or_else(|_| "Error rendering template".to_string()))
}

// API endpoints
pub async fn api_list_posts(
    State(state): State<AppState>,
    Query(params): Query<ListQuery>,
) -> impl IntoResponse {
    let page = params.page.unwrap_or(1);
    let limit = params.limit.unwrap_or(10);
    let offset = (page - 1) * limit as u64;
    let published_only = params.published.unwrap_or(true);

    match state.db.list_posts(published_only, Some(limit), Some(offset as i64)).await {
        Ok(posts) => Json(posts).into_response(),
        Err(_) => (StatusCode::INTERNAL_SERVER_ERROR, "Database error").into_response(),
    }
}

pub async fn create_post(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Json(post): Json<CreatePost>,
) -> impl IntoResponse {
    match state.db.create_post(post).await {
        Ok(created_post) => (StatusCode::CREATED, Json(created_post)).into_response(),
        Err(_) => (StatusCode::INTERNAL_SERVER_ERROR, "Failed to create post").into_response(),
    }
}

pub async fn update_post(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(id): Path<Uuid>,
    Json(update): Json<UpdatePost>,
) -> impl IntoResponse {
    match state.db.update_post(id, update).await {
        Ok(Some(post)) => Json(post).into_response(),
        Ok(None) => (StatusCode::NOT_FOUND, "Post not found").into_response(),
        Err(_) => (StatusCode::INTERNAL_SERVER_ERROR, "Failed to update post").into_response(),
    }
}

pub async fn delete_post(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(id): Path<Uuid>,
) -> impl IntoResponse {
    match state.db.delete_post(id).await {
        Ok(true) => StatusCode::NO_CONTENT.into_response(),
        Ok(false) => (StatusCode::NOT_FOUND, "Post not found").into_response(),
        Err(_) => (StatusCode::INTERNAL_SERVER_ERROR, "Failed to delete post").into_response(),
    }
}

pub async fn login(
    State(state): State<AppState>,
    Json(credentials): Json<LoginRequest>,
) -> impl IntoResponse {
    match state.db.get_user_by_username(&credentials.username).await {
        Ok(Some(user)) => {
            if bcrypt::verify(&credentials.password, &user.password_hash).unwrap_or(false) {
                match create_jwt(&user) {
                    Ok(token) => {
                        let response = AuthResponse {
                            token,
                            user: user.into(),
                        };
                        Json(response).into_response()
                    }
                    Err(_) => (StatusCode::INTERNAL_SERVER_ERROR, "Failed to create token").into_response(),
                }
            } else {
                (StatusCode::UNAUTHORIZED, "Invalid credentials").into_response()
            }
        }
        Ok(None) => (StatusCode::UNAUTHORIZED, "Invalid credentials").into_response(),
        Err(_) => (StatusCode::INTERNAL_SERVER_ERROR, "Database error").into_response(),
    }
}

pub async fn register(
    State(state): State<AppState>,
    Json(user_data): Json<CreateUser>,
) -> impl IntoResponse {
    match state.db.create_user(user_data).await {
        Ok(user) => {
            match create_jwt(&user) {
                Ok(token) => {
                    let response = AuthResponse {
                        token,
                        user: user.into(),
                    };
                    (StatusCode::CREATED, Json(response)).into_response()
                }
                Err(_) => (StatusCode::INTERNAL_SERVER_ERROR, "Failed to create token").into_response(),
            }
        }
        Err(_) => (StatusCode::BAD_REQUEST, "Failed to create user").into_response(),
    }
}