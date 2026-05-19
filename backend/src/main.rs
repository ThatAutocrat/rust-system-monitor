use axum::{
    http::{HeaderValue, Method},
    response::Json,
    routing::get,
    Router,
};
use serde::Serialize;
use sysinfo::{CpuExt, System, SystemExt};
use tower_http::cors::CorsLayer;

#[derive(Serialize)]
struct Stats {
    cpu_usage: f32,
    memory_used_mb: u64,
    memory_total_mb: u64,
    memory_percent: f32,
    uptime_seconds: u64,
    process_count: usize,
    host_name: String,
    os_name: String,
}

async fn get_stats() -> Json<Stats> {
    let mut sys = System::new_all();
    sys.refresh_all();
    std::thread::sleep(std::time::Duration::from_millis(200));
    sys.refresh_cpu();

    let cpu_usage = sys.global_cpu_info().cpu_usage();
    let memory_used_mb = sys.used_memory() / 1024 / 1024;
    let memory_total_mb = sys.total_memory() / 1024 / 1024;
    let memory_percent = (sys.used_memory() as f32 / sys.total_memory() as f32) * 100.0;
    let uptime_seconds = sys.uptime();
    let process_count = sys.processes().len();
    let host_name = sys.host_name().unwrap_or_else(|| "unknown".to_string());
    let os_name = sys.long_os_version().unwrap_or_else(|| "unknown".to_string());

    Json(Stats {
        cpu_usage,
        memory_used_mb,
        memory_total_mb,
        memory_percent,
        uptime_seconds,
        process_count,
        host_name,
        os_name,
    })
}

async fn health() -> &'static str {
    "ok"
}

#[tokio::main]
async fn main() {
    let cors = CorsLayer::new()
        .allow_origin("http://localhost:5173".parse::<HeaderValue>().unwrap())
        .allow_methods([Method::GET]);

    let app = Router::new()
        .route("/api/stats", get(get_stats))
        .route("/health", get(health))
        .layer(cors);

    let addr = "0.0.0.0:3001";
    println!("🦀 Rust system-monitor API running on http://{}", addr);
    println!("   GET /api/stats  → live system metrics");

    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}
