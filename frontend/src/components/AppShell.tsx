// devlook/frontend/src/components/AppShell.tsx
"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, LayoutDashboard, BarChart3, Settings, Github } from "lucide-react";
import clsx from "clsx";

export default function AppShell({ children }: { children: React.ReactNode }) {
    const [open, setOpen] = useState(true);

    return (
        <div className="min-h-screen flex">
            {/* Sidebar */}
            <aside className={clsx(
                "hidden md:flex flex-col gap-2 p-3 transition-all duration-200",
                "border-r border-white/10 bg-white/[0.02]",
                open ? "w-64" : "w-16"
            )}>
                <button
                    onClick={() => setOpen((v) => !v)}
                    className="flex items-center gap-2 rounded-lg px-2 py-2 hover:bg-white/[0.06]"
                    aria-label="Toggle sidebar"
                >
                    <Menu className="h-5 w-5" />
                    {open && <span className="text-sm text-white/70">Collapse</span>}
                </button>

                <nav className="mt-2 space-y-1">
                    <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/[0.06]">
                        <LayoutDashboard className="h-5 w-5" />
                        {open && <span>Dashboard</span>}
                    </Link>
                    <Link href="/reports" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/[0.06]">
                        <BarChart3 className="h-5 w-5" />
                        {open && <span>Reports</span>}
                    </Link>
                    <Link href="/settings" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/[0.06]">
                        <Settings className="h-5 w-5" />
                        {open && <span>Settings</span>}
                    </Link>
                </nav>

                <div className="mt-auto p-3 text-xs text-white/50">
                    v0.1 • DevLook
                </div>
            </aside>

            {/* Main */}
            <div className="flex-1">
                {/* Topbar */}
                <header className="sticky top-0 z-10 backdrop-blur-md bg-[#0b0f17]/70 border-b border-white/10">
                    <div className="mx-auto max-w-7xl px-4 h-14 flex items-center justify-between">
                        <Link href="/" className="flex items-center gap-2">
                            <div className="h-6 w-6 rounded-md bg-gradient-to-br from-sky-400 to-blue-600" />
                            <span className="font-semibold">DevLook</span>
                        </Link>
                        <a
                            href="https://github.com/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-1.5 hover:bg-white/[0.06]"
                        >
                            <Github className="h-4 w-4" />
                            <span className="text-sm">Star on GitHub</span>
                        </a>
                    </div>
                </header>

                {/* Content */}
                <main className="mx-auto max-w-7xl p-4 md:p-6">{children}</main>
            </div>
        </div>
    );
}
