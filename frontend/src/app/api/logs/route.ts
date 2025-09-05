import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    const base = process.env.BACKEND_URL || "http://127.0.0.1:8000";

    // Forward supported query params to FastAPI
    const url = new URL(`${base}/api/logs`);
    const incoming = req.nextUrl.searchParams;

    // Allow: limit, since, until, project
    const allowed = ["limit", "since", "until", "project"];
    for (const key of allowed) {
        const val = incoming.get(key);
        if (val !== null && val !== "") url.searchParams.set(key, val);
    }

    try {
        const res = await fetch(url.toString(), { cache: "no-store" });
        if (!res.ok) {
            return NextResponse.json({ error: "Backend error" }, { status: res.status });
        }
        const data = await res.json();
        return NextResponse.json(data);
    } catch (e: any) {
        return NextResponse.json({ error: e?.message ?? "fetch failed" }, { status: 500 });
    }
}
