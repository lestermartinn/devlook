"use client";

import { useMemo } from "react";
import {
    ResponsiveContainer,
    BarChart,
    CartesianGrid,
    XAxis,
    YAxis,
    Tooltip,
    Bar,
} from "recharts";

export default function DashboardPage() {
    // Mock data for now; we’ll replace with API data later.
    const data = useMemo(
        () => [
            { app: "VS Code", minutes: 120 },
            { app: "Chrome", minutes: 75 },
            { app: "Terminal", minutes: 45 },
            { app: "Slack", minutes: 30 },
        ],
        []
    );

    return (
        <main className="min-h-screen p-6 md:p-10">
            <div className="max-w-5xl mx-auto space-y-6">
                <header className="space-y-1">
                    <h1 className="text-3xl font-semibold tracking-tight">DevLook Dashboard</h1>
                    <p className="text-sm text-gray-500">
                        Mock view — time spent per application (today)
                    </p>
                </header>

                <section className="rounded-2xl border border-gray-200 p-4 md:p-6">
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data} barSize={36}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="app" />
                                <YAxis label={{ value: "Minutes", angle: -90, position: "insideLeft" }} />
                                <Tooltip />
                                <Bar dataKey="minutes" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </section>
            </div>
        </main>
    );
}