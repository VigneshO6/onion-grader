import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight, FileText, Loader2 } from "lucide-react";

import { AppShell, ScreenHeader } from "@/components/app-shell";
import { listReports } from "@/lib/reports.functions";
import { verdict } from "@/lib/report-shape";

export const Route = createFileRoute("/_authenticated/reports")({
  head: () => ({
    meta: [
      { title: "Scan history — OnionGrade AI quality reports" },
      {
        name: "description",
        content:
          "Every onion lot you have graded, with Grade A, URS and reject percentages stored against your farm profile.",
      },
      { property: "og:title", content: "Scan history — OnionGrade AI" },
      {
        property: "og:description",
        content: "Browse past onion lot quality reports saved to your farmer account.",
      },
    ],
  }),
  component: ReportsScreen,
});

function ReportsScreen() {
  const fetchReports = useServerFn(listReports);
  const { data, isPending } = useQuery({
    queryKey: ["reports"],
    queryFn: () => fetchReports({}),
  });

  return (
    <AppShell>
      <ScreenHeader title="Reports" subtitle="Your graded onion lots" />
      <section className="space-y-3 px-5">
        {isPending ? (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" /> Loading history…
          </p>
        ) : null}
        {data?.length === 0 ? (
          <div className="surface rounded-3xl p-6 text-center">
            <FileText className="mx-auto size-7 text-primary" />
            <p className="mt-3 text-sm font-medium text-foreground">No scans yet</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Grade your first lot from the Scan tab.
            </p>
          </div>
        ) : null}
        {data?.map((r) => (
          <Link
            key={r.id}
            to="/report/$id"
            params={{ id: r.id }}
            className="surface grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-3xl p-4"
          >
            <div className="min-w-0">
              <p className="truncate font-display text-base font-semibold text-foreground">
                {r.lotId}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {new Date(r.createdAt).toLocaleDateString()} · {r.totalOnions} bulbs ·{" "}
                {verdict(r.gradeAPercent)}
              </p>
              <div className="mt-2 flex h-1.5 overflow-hidden rounded-full bg-secondary">
                <div className="bg-grade-a" style={{ width: `${r.gradeAPercent}%` }} />
                <div className="bg-urs" style={{ width: `${r.ursPercent}%` }} />
                <div className="bg-reject" style={{ width: `${r.rejectPercent}%` }} />
              </div>
            </div>
            <ChevronRight className="size-5 shrink-0 text-muted-foreground" />
          </Link>
        ))}
      </section>
    </AppShell>
  );
}
