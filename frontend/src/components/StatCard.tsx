// devlook/frontend/src/components/StatCard.tsx
import { ReactNode } from "react";

export default function StatCard({
    label,
    value,
    icon,
    hint,
}: {
    label: string;
    value: string;
    icon?: ReactNode;
    hint?: string;
}) {
    return (
        <div className="card p-4">
            <div className="flex items-center justify-between">
                <span className="text-white/60 text-sm">{label}</span>
                {icon}
            </div>
            <div className="mt-2 text-2xl font-semibold">{value}</div>
            {hint && <div className="mt-1 text-xs text-white/50">{hint}</div>}
        </div>
    );
}
