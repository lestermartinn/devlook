"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
// import AppShell from "@/components/AppShell";
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
// function rangeToSinceISO(range: RangeKey): string {
//     const now = new Date();
//     let ms = 24 * 60 * 60 * 1000;
//     if (range === "7d") ms = 7 * 24 * 60 * 60 * 1000;
//     if (range === "30d") ms = 30 * 24 * 60 * 60 * 1000;
//     return new Date(now.getTime() - ms).toISOString();
// }

function rangeToParams(range: RangeKey): { since: string; until: string } {
    const now = new Date();

    // local midnight today
    const startToday = new Date(now);
    startToday.setHours(0, 0, 0, 0);

    // next local midnight
    const endToday = new Date(now);
    endToday.setHours(24, 0, 0, 0);

    let since = new Date(startToday);
    if (range === "7d") since = new Date(startToday.getTime() - 7 * 24 * 60 * 60 * 1000);
    if (range === "30d") since = new Date(startToday.getTime() - 30 * 24 * 60 * 60 * 1000);

    const until = endToday;
    return { since: since.toISOString(), until: until.toISOString() };
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
            const { since, until } = rangeToParams(r);

            const sumUrl = new URL("/api/summary", window.location.origin);
            sumUrl.searchParams.set("since", since);
            sumUrl.searchParams.set("until", until);
            sumUrl.searchParams.set("limit", "5000");
            const sumRes = await fetch(sumUrl.toString(), { cache: "no-store" });
            if (!sumRes.ok) throw new Error(`Summary HTTP ${sumRes.status}`);
            const sumData: Summary = await sumRes.json();

            const logsUrl = new URL("/api/logs", window.location.origin);
            logsUrl.searchParams.set("since", since);
            logsUrl.searchParams.set("until", until);
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
        <main className="max-w-6xl mx-auto p-6">
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
        </main>
    );
}

