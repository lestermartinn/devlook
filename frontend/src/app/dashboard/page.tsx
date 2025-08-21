// "use client";

// import { useMemo } from "react";
// import {
//     ResponsiveContainer,
//     BarChart,
//     CartesianGrid,
//     XAxis,
//     YAxis,
//     Tooltip,
//     Bar,
// } from "recharts";

// export default function DashboardPage() {
//     // Mock data for now; we’ll replace with API data later.
//     const data = useMemo(
//         () => [
//             { app: "VS Code", minutes: 120 },
//             { app: "Chrome", minutes: 75 },
//             { app: "Terminal", minutes: 45 },
//             { app: "Slack", minutes: 30 },
//         ],
//         []
//     );

//     return (
//         <main className="min-h-screen p-6 md:p-10">
//             <div className="max-w-5xl mx-auto space-y-6">
//                 <header className="space-y-1">
//                     <h1 className="text-3xl font-semibold tracking-tight">DevLook Dashboard</h1>
//                     <p className="text-sm text-gray-500">
//                         Mock view — time spent per application (today)
//                     </p>
//                 </header>

//                 <section className="rounded-2xl border border-gray-200 p-4 md:p-6">
//                     <div className="h-80">
//                         <ResponsiveContainer width="100%" height="100%">
//                             <BarChart data={data} barSize={36}>
//                                 <CartesianGrid strokeDasharray="3 3" />
//                                 <XAxis dataKey="app" />
//                                 <YAxis label={{ value: "Minutes", angle: -90, position: "insideLeft" }} />
//                                 <Tooltip />
//                                 <Bar dataKey="minutes" />
//                             </BarChart>
//                         </ResponsiveContainer>
//                     </div>
//                 </section>
//             </div>
//         </main>
//     );
// }

// "use client";

// import { useEffect, useMemo, useState, useCallback } from "react";
// import {
//     ResponsiveContainer,
//     BarChart,
//     CartesianGrid,
//     XAxis,
//     YAxis,
//     Tooltip,
//     Bar,
// } from "recharts";

// type ActivityRow = {
//     id: number;
//     timestamp: string;
//     app_name: string | null;
//     window_title: string | null;
//     project: string | null;
//     user_id: string | null;
// };

// type RangeKey = "today" | "7d" | "30d";

// function rangeToSinceISO(range: RangeKey): string {
//     const now = new Date();
//     let ms = 24 * 60 * 60 * 1000; // default today (24h)
//     if (range === "7d") ms = 7 * 24 * 60 * 60 * 1000;
//     if (range === "30d") ms = 30 * 24 * 60 * 60 * 1000;
//     return new Date(now.getTime() - ms).toISOString();
// }

// export default function DashboardPage() {
//     const [rows, setRows] = useState<ActivityRow[] | null>(null);
//     const [error, setError] = useState<string | null>(null);
//     const [range, setRange] = useState<RangeKey>("today");
//     const [loading, setLoading] = useState(false);

//     const fetchLogs = useCallback(async (r: RangeKey) => {
//         setLoading(true);
//         setError(null);
//         try {
//             const since = rangeToSinceISO(r);
//             const url = new URL("/api/logs", window.location.origin);
//             url.searchParams.set("since", since);
//             url.searchParams.set("limit", "5000");
//             const res = await fetch(url.toString(), { cache: "no-store" });
//             if (!res.ok) throw new Error(`HTTP ${res.status}`);
//             const data: ActivityRow[] = await res.json();
//             setRows(data);
//         } catch (e: any) {
//             setError(e?.message ?? "Failed to fetch logs");
//         } finally {
//             setLoading(false);
//         }
//     }, []);

//     // initial load
//     useEffect(() => {
//         fetchLogs(range);
//     }, [fetchLogs, range]);

//     // auto-refresh every 30s
//     useEffect(() => {
//         const id = setInterval(() => fetchLogs(range), 30_000);
//         return () => clearInterval(id);
//     }, [fetchLogs, range]);

//     // Aggregate: events -> approx minutes (event ≈ 5s)
//     const chartData = useMemo(() => {
//         if (!rows) return [];
//         const counts = new Map<string, number>();
//         for (const r of rows) {
//             const key = (r.app_name ?? "Unknown").replace(".exe", "");
//             counts.set(key, (counts.get(key) ?? 0) + 1);
//         }
//         return Array.from(counts.entries())
//             .map(([app, count]) => ({
//                 app,
//                 minutes: Math.round((count * 5) / 6) / 10, // one decimal
//                 events: count,
//             }))
//             .sort((a, b) => b.minutes - a.minutes)
//             .slice(0, 12);
//     }, [rows]);

//     const totalMinutes = useMemo(
//         () => chartData.reduce((sum, d) => sum + d.minutes, 0),
//         [chartData]
//     );
//     const topApp = chartData[0]?.app ?? "—";

//     return (
//         <main className="min-h-screen p-6 md:p-10">
//             <div className="max-w-5xl mx-auto space-y-6">
//                 <header className="space-y-1">
//                     <h1 className="text-3xl font-semibold tracking-tight">DevLook Dashboard</h1>
//                     <p className="text-sm text-gray-500">
//                         Live data from your agent (approx. minutes per app)
//                     </p>
//                 </header>

//                 {/* Controls */}
//                 <div className="flex items-center gap-2">
//                     {(["today", "7d", "30d"] as RangeKey[]).map((k) => (
//                         <button
//                             key={k}
//                             onClick={() => setRange(k)}
//                             className={`px-3 py-1.5 rounded-lg border text-sm ${range === k
//                                     ? "bg-gray-900 text-white border-gray-900"
//                                     : "bg-white/5 border-gray-300 hover:bg-white/10"
//                                 }`}
//                         >
//                             {k.toUpperCase()}
//                         </button>
//                     ))}
//                     <span className="ml-auto text-xs text-gray-500">
//                         {loading ? "Refreshing…" : "Auto-refresh every 30s"}
//                     </span>
//                 </div>

//                 {/* Summary */}
//                 <div className="rounded-xl border p-4 text-sm flex gap-6">
//                     <div><span className="text-gray-500">Total focus:</span> {totalMinutes.toFixed(1)} min</div>
//                     <div><span className="text-gray-500">Top app:</span> {topApp}</div>
//                     <div><span className="text-gray-500">Events:</span> {rows?.length ?? 0}</div>
//                 </div>

//                 {error && (
//                     <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
//                         {error}
//                     </div>
//                 )}

//                 {!rows && !error && (
//                     <div className="rounded-md border p-4 text-sm text-gray-500">Loading…</div>
//                 )}

//                 {rows && (
//                     <section className="rounded-2xl border border-gray-200 p-4 md:p-6">
//                         <div className="h-80">
//                             <ResponsiveContainer width="100%" height="100%">
//                                 <BarChart data={chartData} barSize={36}>
//                                     <CartesianGrid strokeDasharray="3 3" />
//                                     <XAxis dataKey="app" />
//                                     <YAxis
//                                         label={{ value: "Minutes (approx.)", angle: -90, position: "insideLeft" }}
//                                     />
//                                     <Tooltip />
//                                     <Bar dataKey="minutes" />
//                                 </BarChart>
//                             </ResponsiveContainer>
//                         </div>
//                         <p className="mt-2 text-xs text-gray-500">
//                             Estimate assumes one event ≈ 5 seconds. We’ll refine with sessionization later.
//                         </p>
//                     </section>
//                 )}
//             </div>
//         </main>
//     );
// }

// "use client";

// import { useEffect, useMemo, useState, useCallback } from "react";
// import {
//     ResponsiveContainer,
//     BarChart,
//     CartesianGrid,
//     XAxis,
//     YAxis,
//     Tooltip,
//     Bar,
// } from "recharts";

// type RangeKey = "today" | "7d" | "30d";
// function rangeToSinceISO(range: RangeKey): string {
//     const now = new Date();
//     let ms = 24 * 60 * 60 * 1000;
//     if (range === "7d") ms = 7 * 24 * 60 * 60 * 1000;
//     if (range === "30d") ms = 30 * 24 * 60 * 60 * 1000;
//     return new Date(now.getTime() - ms).toISOString();
// }

// type Summary = {
//     total_events: number;
//     total_minutes: number;
//     apps: { app: string; events: number; minutes: number }[];
// };

// type ActivityRow = {
//     id: number;
//     timestamp: string;
//     app_name: string | null;
//     window_title: string | null;
//     project: string | null;
//     user_id: string | null;
// };

// export default function DashboardPage() {
//     const [range, setRange] = useState<RangeKey>("today");
//     const [loading, setLoading] = useState(false);
//     const [summary, setSummary] = useState<Summary | null>(null);
//     const [rows, setRows] = useState<ActivityRow[] | null>(null);
//     const [error, setError] = useState<string | null>(null);

//     const fetchAll = useCallback(async (r: RangeKey) => {
//         setLoading(true);
//         setError(null);
//         try {
//             const since = rangeToSinceISO(r);

//             // summary
//             const sumUrl = new URL("/api/summary", window.location.origin);
//             sumUrl.searchParams.set("since", since);
//             sumUrl.searchParams.set("limit", "5000");
//             const sumRes = await fetch(sumUrl.toString(), { cache: "no-store" });
//             if (!sumRes.ok) throw new Error(`Summary HTTP ${sumRes.status}`);
//             const sumData: Summary = await sumRes.json();

//             // recent rows (for table)
//             const logsUrl = new URL("/api/logs", window.location.origin);
//             logsUrl.searchParams.set("since", since);
//             logsUrl.searchParams.set("limit", "100");
//             const logsRes = await fetch(logsUrl.toString(), { cache: "no-store" });
//             if (!logsRes.ok) throw new Error(`Logs HTTP ${logsRes.status}`);
//             const logsData: ActivityRow[] = await logsRes.json();

//             setSummary(sumData);
//             setRows(logsData);
//         } catch (e: any) {
//             setError(e?.message ?? "Failed to fetch data");
//         } finally {
//             setLoading(false);
//         }
//     }, []);

//     useEffect(() => {
//         fetchAll(range);
//     }, [fetchAll, range]);

//     useEffect(() => {
//         const id = setInterval(() => fetchAll(range), 30_000);
//         return () => clearInterval(id);
//     }, [fetchAll, range]);

//     const chartData = useMemo(() => summary?.apps ?? [], [summary]);

//     return (
//         <main className="min-h-screen p-6 md:p-10">
//             <div className="max-w-6xl mx-auto space-y-6">
//                 <header className="space-y-1">
//                     <h1 className="text-3xl font-semibold tracking-tight">DevLook Dashboard</h1>
//                     <p className="text-sm text-gray-500">
//                         Approximate minutes per app (1 event ≈ 5 seconds)
//                     </p>
//                 </header>

//                 {/* Controls */}
//                 <div className="flex items-center gap-2">
//                     {(["today", "7d", "30d"] as RangeKey[]).map((k) => (
//                         <button
//                             key={k}
//                             onClick={() => setRange(k)}
//                             className={`px-3 py-1.5 rounded-lg border text-sm ${range === k
//                                     ? "bg-gray-900 text-white border-gray-900"
//                                     : "bg-white/5 border-gray-300 hover:bg-white/10"
//                                 }`}
//                         >
//                             {k.toUpperCase()}
//                         </button>
//                     ))}
//                     <span className="ml-auto text-xs text-gray-500">
//                         {loading ? "Refreshing…" : "Auto-refresh every 30s"}
//                     </span>
//                 </div>

//                 {/* Summary */}
//                 <div className="rounded-xl border p-4 text-sm flex flex-wrap gap-6">
//                     <div><span className="text-gray-500">Total focus:</span> {summary?.total_minutes?.toFixed(1) ?? "—"} min</div>
//                     <div><span className="text-gray-500">Top app:</span> {chartData[0]?.app ?? "—"}</div>
//                     <div><span className="text-gray-500">Events:</span> {summary?.total_events ?? 0}</div>
//                 </div>

//                 {error && (
//                     <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
//                         {error}
//                     </div>
//                 )}

//                 {/* Chart */}
//                 <section className="rounded-2xl border border-gray-200 p-4 md:p-6">
//                     <div className="h-80">
//                         <ResponsiveContainer width="100%" height="100%">
//                             <BarChart data={chartData} barSize={36}>
//                                 <CartesianGrid strokeDasharray="3 3" />
//                                 <XAxis dataKey="app" />
//                                 <YAxis label={{ value: "Minutes (approx.)", angle: -90, position: "insideLeft" }} />
//                                 <Tooltip />
//                                 <Bar dataKey="minutes" />
//                             </BarChart>
//                         </ResponsiveContainer>
//                     </div>
//                 </section>

//                 {/* Recent activity table */}
//                 <section className="rounded-2xl border border-gray-200 p-4 md:p-6">
//                     <h2 className="text-lg font-medium mb-3">Recent activity</h2>
//                     <div className="overflow-x-auto">
//                         <table className="w-full text-sm">
//                             <thead>
//                                 <tr className="text-left text-gray-500 border-b">
//                                     <th className="py-2 pr-4">Time (UTC)</th>
//                                     <th className="py-2 pr-4">App</th>
//                                     <th className="py-2 pr-4">Window Title</th>
//                                 </tr>
//                             </thead>
//                             <tbody>
//                                 {(rows ?? []).map((r) => (
//                                     <tr key={r.id} className="border-b last:border-0">
//                                         <td className="py-2 pr-4">{new Date(r.timestamp).toISOString().replace("T", " ").slice(0, 19)}</td>
//                                         <td className="py-2 pr-4">{(r.app_name ?? "Unknown").replace(".exe", "")}</td>
//                                         <td className="py-2 pr-4">{r.window_title ?? "—"}</td>
//                                     </tr>
//                                 ))}
//                                 {(!rows || rows.length === 0) && (
//                                     <tr>
//                                         <td className="py-2 pr-4" colSpan={3}>No recent activity in this range.</td>
//                                     </tr>
//                                 )}
//                             </tbody>
//                         </table>
//                     </div>
//                 </section>
//             </div>
//         </main>
//     );
// }

"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import AppShell from "@/components/AppShell";
import StatCard from "@/components/StatCard";
import { Clock3, MonitorSmartphone, Activity } from "lucide-react";
import {
    ResponsiveContainer,
    BarChart,
    CartesianGrid,
    XAxis,
    YAxis,
    Tooltip,
    Bar,
} from "recharts";

type RangeKey = "today" | "7d" | "30d";
function rangeToSinceISO(range: RangeKey): string {
    const now = new Date();
    let ms = 24 * 60 * 60 * 1000;
    if (range === "7d") ms = 7 * 24 * 60 * 60 * 1000;
    if (range === "30d") ms = 30 * 24 * 60 * 60 * 1000;
    return new Date(now.getTime() - ms).toISOString();
}

type Summary = {
    total_events: number;
    total_minutes: number;
    apps: { app: string; events: number; minutes: number }[];
};
type ActivityRow = {
    id: number;
    timestamp: string;
    app_name: string | null;
    window_title: string | null;
    project: string | null;
    user_id: string | null;
};

export default function DashboardPage() {
    const [range, setRange] = useState<RangeKey>("today");
    const [loading, setLoading] = useState(false);
    const [summary, setSummary] = useState<Summary | null>(null);
    const [rows, setRows] = useState<ActivityRow[] | null>(null);
    const [error, setError] = useState<string | null>(null);

    const fetchAll = useCallback(async (r: RangeKey) => {
        setLoading(true);
        setError(null);
        try {
            const since = rangeToSinceISO(r);

            const sumUrl = new URL("/api/summary", window.location.origin);
            sumUrl.searchParams.set("since", since);
            sumUrl.searchParams.set("limit", "5000");
            const sumRes = await fetch(sumUrl.toString(), { cache: "no-store" });
            if (!sumRes.ok) throw new Error(`Summary HTTP ${sumRes.status}`);
            const sumData: Summary = await sumRes.json();

            const logsUrl = new URL("/api/logs", window.location.origin);
            logsUrl.searchParams.set("since", since);
            logsUrl.searchParams.set("limit", "100");
            const logsRes = await fetch(logsUrl.toString(), { cache: "no-store" });
            if (!logsRes.ok) throw new Error(`Logs HTTP ${logsRes.status}`);
            const logsData: ActivityRow[] = await logsRes.json();

            setSummary(sumData);
            setRows(logsData);
        } catch (e: any) {
            setError(e?.message ?? "Failed to fetch data");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchAll(range); }, [fetchAll, range]);
    useEffect(() => {
        const id = setInterval(() => fetchAll(range), 30_000);
        return () => clearInterval(id);
    }, [fetchAll, range]);

    const chartData = useMemo(() => summary?.apps ?? [], [summary]);

    return (
        <AppShell>
            {/* Header */}
            <div className="mb-4">
                <h1 className="text-3xl font-semibold">Dashboard</h1>
                <p className="text-sm text-white/60">Private, actionable analytics from your local agent</p>
            </div>

            {/* Controls */}
            <div className="surface p-2 mb-4 flex items-center gap-2">
                {(["today", "7d", "30d"] as RangeKey[]).map((k) => (
                    <button
                        key={k}
                        onClick={() => setRange(k)}
                        className={`px-3 py-1.5 rounded-lg border text-sm ${range === k
                                ? "bg-white/10 border-white/20"
                                : "bg-transparent border-white/10 hover:bg-white/5"
                            }`}
                    >
                        {k.toUpperCase()}
                    </button>
                ))}
                <span className="ml-auto text-xs text-white/50">
                    {loading ? "Refreshing…" : "Auto-refresh every 30s"}
                </span>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                <StatCard
                    label="Total Focus"
                    value={`${summary?.total_minutes?.toFixed(1) ?? "—"} min`}
                    icon={<Clock3 className="h-5 w-5 text-white/60" />}
                    hint="Approx. (1 event ≈ 5s)"
                />
                <StatCard
                    label="Top App"
                    value={summary?.apps?.[0]?.app ?? "—"}
                    icon={<MonitorSmartphone className="h-5 w-5 text-white/60" />}
                    hint={`${summary?.apps?.[0]?.minutes?.toFixed?.(1) ?? "0"} min`}
                />
                <StatCard
                    label="Events"
                    value={`${summary?.total_events ?? 0}`}
                    icon={<Activity className="h-5 w-5 text-white/60" />}
                    hint="Newest to oldest"
                />
            </div>

            {/* Chart */}
            <section className="surface p-4 mb-4">
                <div className="flex items-center justify-between mb-2">
                    <h2 className="section-title">Minutes by App</h2>
                </div>
                <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} barSize={36}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="app" />
                            <YAxis label={{ value: "Minutes", angle: -90, position: "insideLeft" }} />
                            <Tooltip />
                            <Bar dataKey="minutes" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </section>

            {/* Recent Activity */}
            <section className="surface p-4">
                <h2 className="section-title mb-3">Recent Activity</h2>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-left text-white/60 border-b border-white/10">
                                <th className="py-2 pr-4">Time (EST)</th>
                                <th className="py-2 pr-4">App</th>
                                <th className="py-2 pr-4">Window Title</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(rows ?? []).map((r) => (
                                <tr key={r.id} className="border-b border-white/5 last:border-0">
                                    <td className="py-2 pr-4">
                                        {new Date(r.timestamp).toLocaleString("en-US", {
                                            timeZone: "America/New_York",
                                            dateStyle: "short",
                                            timeStyle: "short",
                                        })}
                                    </td>
                                    <td className="py-2 pr-4">{(r.app_name ?? "Unknown").replace(".exe", "")}</td>
                                    <td className="py-2 pr-4">{r.window_title ?? "—"}</td>
                                </tr>
                            ))}
                            {(!rows || rows.length === 0) && (
                                <tr>
                                    <td className="py-2 pr-4" colSpan={3}>No activity in this range.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </section>

            {error && (
                <div className="mt-4 surface p-3 text-sm text-red-300 border-red-600/30">
                    {error}
                </div>
            )}
        </AppShell>
    );
}

