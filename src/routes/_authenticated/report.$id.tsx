import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Bell, FileDown, Loader2, Share2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/app-shell";
import { ReportView } from "@/components/report-view";
import { Button } from "@/components/ui/button";
import { getReport } from "@/lib/reports.functions";
import { shareOrDownloadReportPdf } from "@/lib/report-pdf";
import { Switch } from "@/components/ui/switch";

export const Route = createFileRoute("/_authenticated/report/$id")({
  head: () => ({
    meta: [
      { title: "Onion lot quality report — OnionGrade AI" },
      {
        name: "description",
        content:
          "Full AI quality report for one onion lot: Grade A, URS and reject percentages, bulb count, average diameter and defect breakdown.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
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
  const [notifications, setNotifications] = useState(true);

  async function download() {
    if (!data) return;
    const result = await shareOrDownloadReportPdf(data);
    toast.success(result === "shared" ? "Report shared" : "PDF downloaded");
  }

  return (
    <AppShell>
      <header className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 pb-5">
        <Link
          to="/reports"
          aria-label="Back to reports"
          className="surface grid size-10 shrink-0 place-items-center rounded-full text-foreground"
        >
          <ArrowLeft className="size-5" />
        </Link>
        <h1 className="truncate font-display text-xl font-bold text-foreground">Analysis Result</h1>
        <Button size="icon" variant="secondary" aria-label="Share report" onClick={download}><Share2 className="size-4" /></Button>
      </header>

      <section className="space-y-4">
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
            <div className="space-y-4">
              <Button className="btn-violet h-14 w-full rounded-2xl text-sm font-extrabold" onClick={download}>
                <FileDown className="size-5" /> Download Grading Report (PDF)
              </Button>
              <div className="surface flex items-center gap-3 rounded-2xl p-4">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-accent text-accent-foreground"><Bell className="size-5" /></span>
                <div className="min-w-0 flex-1"><p className="text-sm font-bold text-foreground">Enable Notifications</p><p className="text-xs text-muted-foreground">Get alerts for scan results and system updates</p></div>
                <Switch checked={notifications} onCheckedChange={setNotifications} aria-label="Enable notifications" />
              </div>
            </div>
          </>
        ) : null}
      </section>
    </AppShell>
  );
}
