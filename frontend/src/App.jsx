import { useState, useEffect, useRef } from "react";

const API = "http://localhost:3001/api/stats";

function formatUptime(seconds) {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m ${seconds % 60}s`;
}

function Arc({ percent, color }) {
  const r = 54;
  const circ = 2 * Math.PI * r;
  const offset = circ - (percent / 100) * circ;
  return (
    <svg width="140" height="140" viewBox="0 0 140 140">
      <circle cx="70" cy="70" r={r} fill="none" stroke="#1a1a1a" strokeWidth="10" />
      <circle
        cx="70" cy="70" r={r} fill="none"
        stroke={color} strokeWidth="10"
        strokeDasharray={circ}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform="rotate(-90 70 70)"
        style={{ transition: "stroke-dashoffset 0.6s ease" }}
      />
    </svg>
  );
}

function StatCard({ label, value, sub, percent, color, mono }) {
  return (
    <div className="relative overflow-hidden rounded-2xl p-6 flex flex-col gap-4"
      style={{ background: "#111", border: "1px solid #222" }}>
      <div className="flex items-center justify-between">
        <span className="text-xs tracking-widest uppercase text-neutral-500">{label}</span>
        <span className="text-xs text-neutral-600" style={{ fontFamily: "'DM Mono', monospace" }}>{sub}</span>
      </div>
      {percent !== undefined ? (
        <div className="flex items-center gap-6">
          <div className="relative flex items-center justify-center">
            <Arc percent={percent} color={color} />
            <span className="absolute text-xl font-bold" style={{ fontFamily: "'DM Mono', monospace", color }}>
              {percent.toFixed(1)}%
            </span>
          </div>
          <div className="flex-1">
            <div className="h-1.5 rounded-full bg-neutral-800 overflow-hidden">
              <div className="h-full rounded-full transition-all duration-700"
                style={{ width: `${percent}%`, background: color }} />
            </div>
          </div>
        </div>
      ) : (
        <div className="flex items-end gap-2">
          <span className="text-4xl font-bold tracking-tight"
            style={{ fontFamily: mono ? "'DM Mono', monospace" : undefined, color }}>
            {value}
          </span>
        </div>
      )}
    </div>
  );
}

function Pulse({ active }) {
  return (
    <div className="flex items-center gap-2">
      <div className="relative flex h-2 w-2">
        {active && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />}
        <span className={`relative inline-flex rounded-full h-2 w-2 ${active ? "bg-emerald-500" : "bg-neutral-600"}`} />
      </div>
      <span className="text-xs text-neutral-500">{active ? "live" : "offline"}</span>
    </div>
  );
}

export default function App() {
  const [stats, setStats] = useState(null);
  const [prev, setPrev] = useState(null);
  const [live, setLive] = useState(false);
  const [tick, setTick] = useState(0);
  const timerRef = useRef(null);

  async function fetchStats() {
    try {
      const r = await fetch(API);
      const d = await r.json();
      setPrev(s => s);
      setStats(d);
      setLive(true);
    } catch {
      setLive(false);
    }
  }

  useEffect(() => {
    fetchStats();
    timerRef.current = setInterval(() => {
      fetchStats();
      setTick(t => t + 1);
    }, 2000);
    return () => clearInterval(timerRef.current);
  }, []);

  const cpuColor = stats?.cpu_usage > 80 ? "#ef4444" : stats?.cpu_usage > 50 ? "#f59e0b" : "#22d3ee";
  const memColor = stats?.memory_percent > 80 ? "#ef4444" : stats?.memory_percent > 60 ? "#f59e0b" : "#a78bfa";

  return (
    <div className="min-h-screen px-6 py-10 max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-10 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight" style={{ letterSpacing: "-0.03em" }}>
            SYS<span style={{ color: "#22d3ee" }}>MON</span>
          </h1>
          <p className="text-sm text-neutral-500 mt-1" style={{ fontFamily: "'DM Mono', monospace" }}>
            {stats?.host_name ?? "—"} · {stats?.os_name?.split(" ").slice(0, 3).join(" ") ?? "—"}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <Pulse active={live} />
          <span className="text-xs text-neutral-700" style={{ fontFamily: "'DM Mono', monospace" }}>
            tick #{tick}
          </span>
        </div>
      </div>

      {/* Stats grid */}
      {stats ? (
        <div className="grid grid-cols-1 gap-4">
          <div className="grid grid-cols-2 gap-4">
            <StatCard
              label="CPU Usage"
              sub={`${stats.cpu_usage.toFixed(1)}%`}
              percent={stats.cpu_usage}
              color={cpuColor}
            />
            <StatCard
              label="Memory"
              sub={`${stats.memory_used_mb} / ${stats.memory_total_mb} MB`}
              percent={stats.memory_percent}
              color={memColor}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <StatCard
              label="Uptime"
              value={formatUptime(stats.uptime_seconds)}
              color="#34d399"
            />
            <StatCard
              label="Processes"
              value={stats.process_count.toString()}
              sub="running"
              color="#fb923c"
              mono
            />
          </div>
        </div>
      ) : (
        <div className="text-center py-24 text-neutral-600">
          <div className="text-5xl mb-4">🦀</div>
          <p className="text-sm" style={{ fontFamily: "'DM Mono', monospace" }}>
            connecting to rust backend...
          </p>
          <p className="text-xs text-neutral-700 mt-2">make sure the server is running on :3001</p>
        </div>
      )}

      {/* Footer */}
      <div className="mt-10 text-center text-xs text-neutral-700" style={{ fontFamily: "'DM Mono', monospace" }}>
        🦀 axum · react · tailwind · refreshes every 2s
      </div>
    </div>
  );
}
