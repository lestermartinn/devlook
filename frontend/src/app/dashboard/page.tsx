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

"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import {
    ResponsiveContainer,
    BarChart,
    CartesianGrid,
    XAxis,
    YAxis,
    Tooltip,
    Bar,
} from "recharts";

type ActivityRow = {
    id: number;
    timestamp: string;
    app_name: string | null;
    window_title: string | null;
    project: string | null;
    user_id: string | null;
};

type RangeKey = "today" | "7d" | "30d";

function rangeToSinceISO(range: RangeKey): string {
    const now = new Date();
    let ms = 24 * 60 * 60 * 1000; // default today (24h)
    if (range === "7d") ms = 7 * 24 * 60 * 60 * 1000;
    if (range === "30d") ms = 30 * 24 * 60 * 60 * 1000;
    return new Date(now.getTime() - ms).toISOString();
}

export default function DashboardPage() {
    const [rows, setRows] = useState<ActivityRow[] | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [range, setRange] = useState<RangeKey>("today");
    const [loading, setLoading] = useState(false);

    const fetchLogs = useCallback(async (r: RangeKey) => {
        setLoading(true);
        setError(null);
        try {
            const since = rangeToSinceISO(r);
            const url = new URL("/api/logs", window.location.origin);
            url.searchParams.set("since", since);
            url.searchParams.set("limit", "5000");
            const res = await fetch(url.toString(), { cache: "no-store" });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data: ActivityRow[] = await res.json();
            setRows(data);
        } catch (e: any) {
            setError(e?.message ?? "Failed to fetch logs");
        } finally {
            setLoading(false);
        }
    }, []);

    // initial load
    useEffect(() => {
        fetchLogs(range);
    }, [fetchLogs, range]);

    // auto-refresh every 30s
    useEffect(() => {
        const id = setInterval(() => fetchLogs(range), 30_000);
        return () => clearInterval(id);
    }, [fetchLogs, range]);

    // Aggregate: events -> approx minutes (event ≈ 5s)
    const chartData = useMemo(() => {
        if (!rows) return [];
        const counts = new Map<string, number>();
        for (const r of rows) {
            const key = (r.app_name ?? "Unknown").replace(".exe", "");
            counts.set(key, (counts.get(key) ?? 0) + 1);
        }
        return Array.from(counts.entries())
            .map(([app, count]) => ({
                app,
                minutes: Math.round((count * 5) / 6) / 10, // one decimal
                events: count,
            }))
            .sort((a, b) => b.minutes - a.minutes)
            .slice(0, 12);
    }, [rows]);

    const totalMinutes = useMemo(
        () => chartData.reduce((sum, d) => sum + d.minutes, 0),
        [chartData]
    );
    const topApp = chartData[0]?.app ?? "—";

    return (
        <main className="min-h-screen p-6 md:p-10">
            <div className="max-w-5xl mx-auto space-y-6">
                <header className="space-y-1">
                    <h1 className="text-3xl font-semibold tracking-tight">DevLook Dashboard</h1>
                    <p className="text-sm text-gray-500">
                        Live data from your agent (approx. minutes per app)
                    </p>
                </header>

                {/* Controls */}
                <div className="flex items-center gap-2">
                    {(["today", "7d", "30d"] as RangeKey[]).map((k) => (
                        <button
                            key={k}
                            onClick={() => setRange(k)}
                            className={`px-3 py-1.5 rounded-lg border text-sm ${range === k
                                    ? "bg-gray-900 text-white border-gray-900"
                                    : "bg-white/5 border-gray-300 hover:bg-white/10"
                                }`}
                        >
                            {k.toUpperCase()}
                        </button>
                    ))}
                    <span className="ml-auto text-xs text-gray-500">
                        {loading ? "Refreshing…" : "Auto-refresh every 30s"}
                    </span>
                </div>

                {/* Summary */}
                <div className="rounded-xl border p-4 text-sm flex gap-6">
                    <div><span className="text-gray-500">Total focus:</span> {totalMinutes.toFixed(1)} min</div>
                    <div><span className="text-gray-500">Top app:</span> {topApp}</div>
                    <div><span className="text-gray-500">Events:</span> {rows?.length ?? 0}</div>
                </div>

                {error && (
                    <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                        {error}
                    </div>
                )}

                {!rows && !error && (
                    <div className="rounded-md border p-4 text-sm text-gray-500">Loading…</div>
                )}

                {rows && (
                    <section className="rounded-2xl border border-gray-200 p-4 md:p-6">
                        <div className="h-80">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData} barSize={36}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="app" />
                                    <YAxis
                                        label={{ value: "Minutes (approx.)", angle: -90, position: "insideLeft" }}
                                    />
                                    <Tooltip />
                                    <Bar dataKey="minutes" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                        <p className="mt-2 text-xs text-gray-500">
                            Estimate assumes one event ≈ 5 seconds. We’ll refine with sessionization later.
                        </p>
                    </section>
                )}
            </div>
        </main>
    );
}
