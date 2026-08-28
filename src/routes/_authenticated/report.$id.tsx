import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Download, Loader2, Printer } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { ReportView } from "@/components/report-view";
import { Button } from "@/components/ui/button";
import { getReport } from "@/lib/reports.functions";

export const Route = createFileRoute("/_authenticated/report/$id")({
  head: () => ({
    meta: [
      { title: "Onion lot quality report — OnionGrade AI" },
      {
        name: "description",
        content:
          "Full AI quality report for one onion lot: Grade A, URS and reject percentages, bulb count, average diameter and defect breakdown.",
      },
      { property: "og:title", content: "Onion lot quality report — OnionGrade AI" },
      {
        property: "og:description",
        content: "Grade A vs URS split, defect counts and inspector notes for a graded onion lot.",
      },
    ],
  }),
  component: ReportScreen,
});

function ReportScreen() {
  const { id } = useParams({ from: "/_authenticated/report/$id" });
  const fetchReport = useServerFn(getReport);
  const { data, isPending } = useQuery({
    queryKey: ["report", id],
    queryFn: () => fetchReport({ data: { id } }),
  });

  function download() {
    if (!data) return;
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${data.lotId}-quality-report.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <AppShell>
      <header className="flex items-center gap-3 px-5 pt-8 pb-4">
        <Link
          to="/reports"
          aria-label="Back to reports"
          className="surface grid size-10 shrink-0 place-items-center rounded-full text-foreground"
        >
          <ArrowLeft className="size-5" />
        </Link>
        <h1 className="truncate font-display text-xl font-bold text-foreground">Quality report</h1>
      </header>

      <section className="space-y-4 px-5">
        {isPending ? (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" /> Loading report…
          </p>
        ) : null}
        {!isPending && !data ? (
          <p className="text-sm text-muted-foreground">This report is no longer available.</p>
        ) : null}
        {data ? (
          <>
            <ReportView report={data} />
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="secondary"
                className="h-11 rounded-xl"
                onClick={() => window.print()}
              >
                <Printer className="size-4" /> Print
              </Button>
              <Button variant="secondary" className="h-11 rounded-xl" onClick={download}>
                <Download className="size-4" /> Save
              </Button>
            </div>
          </>
        ) : null}
      </section>
    </AppShell>
  );
}
