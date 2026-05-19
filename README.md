# 🦀 System Monitor — Rust + React + Tailwind

A live system stats dashboard. Rust backend reads CPU, RAM, uptime via `sysinfo` and exposes a JSON API. React frontend polls every 2s and renders animated stat cards.



## Stack
- **Backend**: Rust, Axum, sysinfo, tokio
- **Frontend**: React, Vite, Tailwind CSS
- **API**: `GET /api/stats` → JSON with cpu_usage, memory_percent, uptime_seconds, process_count, host_name, os_name
