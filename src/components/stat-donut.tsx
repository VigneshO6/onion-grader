import type { ReactNode } from "react";

const tones = {
  "grade-a": {
    ring: "stroke-grade-a",
    track: "stroke-grade-a-soft",
    text: "text-grade-a",
    chip: "bg-grade-a-soft text-grade-a",
  },
  urs: {
    ring: "stroke-urs",
    track: "stroke-urs-soft",
    text: "text-urs",
    chip: "bg-urs-soft text-urs",
  },
  reject: {
    ring: "stroke-reject",
    track: "stroke-reject-soft",
    text: "text-reject",
    chip: "bg-reject-soft text-reject",
  },
  rejected: {
    ring: "stroke-rejected",
    track: "stroke-rejected-soft",
    text: "text-rejected",
    chip: "bg-rejected-soft text-rejected",
  },
} as const;

export function StatDonut({
  label,
  percent,
  caption,
  tone,
  icon,
}: {
  label: string;
  percent: number;
  caption: string;
  tone: keyof typeof tones;
  icon: ReactNode;
}) {
  const t = tones[tone];
  const clamped = Math.max(0, Math.min(100, percent));
  const r = 26;
  const c = 2 * Math.PI * r;

  return (
    <div className="surface grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-2xl p-4">
      <div className="min-w-0">
        <p className={`truncate text-sm font-bold ${t.text}`}>{label}</p>
        <p className="font-display text-3xl font-extrabold text-foreground">
          {Math.round(clamped)}
          <span className="text-lg font-bold text-muted-foreground">%</span>
        </p>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">{caption}</p>
      </div>
      <div className="relative size-16 shrink-0">
        <svg viewBox="0 0 64 64" className="size-full -rotate-90">
          <circle cx="32" cy="32" r={r} fill="none" strokeWidth="7" className={t.track} />
          <circle
            cx="32"
            cy="32"
            r={r}
            fill="none"
            strokeWidth="7"
            strokeLinecap="round"
            className={`${t.ring} transition-[stroke-dashoffset] duration-700`}
            strokeDasharray={c}
            strokeDashoffset={c - (c * clamped) / 100}
          />
        </svg>
        <span
          className={`absolute inset-0 grid place-items-center rounded-full ${t.text}`}
          aria-hidden
        >
          {icon}
        </span>
      </div>
    </div>
  );
}
