use axum::{
    extract::{Path, Query, State},
    http::StatusCode,
    response::{Html, IntoResponse, Response},
    routing::{get, post, put, delete},
    Json, Router,
};
use tower_http::services::ServeDir;
use std::collections::HashMap;
use std::sync::Arc;
use tokio::net::TcpListener;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

mod models;
mod handlers;
mod database;
mod auth;
mod templates;
mod forum_handlers;

use database::Database;

#[derive(Clone)]
pub struct AppState {
    pub db: Arc<Database>,
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    tracing_subscriber::registry()
        .with(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "rust_blog=debug,tower_http=debug".into()),
        )
        .with(tracing_subscriber::fmt::layer())
        .init();

    dotenv::dotenv().ok();

    let database_url = std::env::var("DATABASE_URL")
        .unwrap_or_else(|_| "postgres://postgres:password@localhost/rust_blog".to_string());

    let db = Arc::new(Database::new(&database_url).await?);
    db.migrate().await?;

    let state = AppState { db };

    let app = Router::new()
        // Blog routes
        .route("/", get(handlers::index))
        .route("/posts", get(handlers::list_posts))
        .route("/posts/:id", get(handlers::get_post))
        .route("/admin", get(handlers::admin_panel))

        // Forum routes
        .route("/forum", get(forum_handlers::forum_index))
        .route("/forum/c/:category_id", get(forum_handlers::category_page))
        .route("/forum/t/:slug", get(forum_handlers::topic_page))
        .route("/forum/create", get(forum_handlers::create_topic_page))

        // API routes for blog
        .route("/api/posts", post(handlers::create_post))
        .route("/api/posts/:id", put(handlers::update_post))
        .route("/api/posts/:id", delete(handlers::delete_post))
        .route("/api/posts", get(handlers::api_list_posts))
        .route("/api/auth/login", post(handlers::login))
        .route("/api/auth/register", post(handlers::register))

        // API routes for forum
        .route("/api/forum/categories", get(forum_handlers::api_list_categories))
        .route("/api/forum/categories", post(forum_handlers::api_create_category))
        .route("/api/forum/categories/:id", get(forum_handlers::api_get_category))
        .route("/api/forum/topics", get(forum_handlers::api_list_topics))
        .route("/api/forum/topics", post(forum_handlers::api_create_topic))
        .route("/api/forum/topics/:slug", get(forum_handlers::api_get_topic))
        .route("/api/forum/topics/:topic_id/replies", get(forum_handlers::api_list_replies))
        .route("/api/forum/topics/:topic_id/replies", post(forum_handlers::api_create_reply))
        .route("/api/forum/users/:user_id/profile", get(forum_handlers::api_get_user_profile))

        // Health check and static files
        .route("/health", get(health_check))
        .nest_service("/static", ServeDir::new("static"))
        .with_state(state);

    let port = std::env::var("PORT").unwrap_or_else(|_| "3000".to_string());
    let addr = format!("0.0.0.0:{}", port);

    tracing::info!("Starting server on {}", addr);
    let listener = TcpListener::bind(&addr).await?;
    axum::serve(listener, app).await?;

    Ok(())
}

async fn health_check() -> impl IntoResponse {
    Json(serde_json::json!({"status": "healthy"}))
}