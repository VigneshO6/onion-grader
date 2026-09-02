import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useRef, useState } from "react";
import {
  Camera,
  Loader2,
  ScanLine,
  Upload,
  RotateCcw,
  Printer,
  Download,
  Award,
  Ruler,
  AlertTriangle,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/app-shell";
import { StatDonut } from "@/components/stat-donut";
import { ReportView } from "@/components/report-view";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { analyzeOnionImage } from "@/lib/onion.functions";
import { getFarmerProfile } from "@/lib/farmer.functions";
import { fileToCompressedDataUrl } from "@/lib/image";
import type { OnionReport } from "@/lib/report-shape";
import heroImage from "@/assets/onion-hero.jpg";

export const Route = createFileRoute("/_authenticated/")({
  head: () => ({
    meta: [
      { title: "OnionGrade AI — Instant onion quality grading" },
      {
        name: "description",
        content:
          "Scan an onion lot with your phone camera and get Grade A vs URS percentages, defect breakdown and a shareable digital quality report in seconds.",
      },
      { property: "og:title", content: "OnionGrade AI — Instant onion quality grading" },
      {
        property: "og:description",
        content:
          "AI image analysis that spots rotten, sprouted, damaged and undersized onions and grades any lot without human bias.",
      },
    ],
  }),
  component: ScanScreen,
});

function ScanScreen() {
  const navigate = useNavigate();
  const analyze = useServerFn(analyzeOnionImage);
  const fetchProfile = useServerFn(getFarmerProfile);
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [lotId, setLotId] = useState("");
  const [report, setReport] = useState<OnionReport | null>(null);

  const profile = useQuery({ queryKey: ["farmer-profile"], queryFn: () => fetchProfile({}) });

  const mutation = useMutation({
    mutationFn: async (imageDataUrl: string) =>
      analyze({ data: { imageDataUrl, lotId: lotId || undefined } }),
    onSuccess: (result) => {
      setReport(result);
      toast.success("Quality report ready");
    },
    onError: (error: Error) => toast.error(error.message || "Analysis failed"),
  });

  async function handleFile(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose a photo of the onion lot");
      return;
    }
    try {
      const dataUrl = await fileToCompressedDataUrl(file);
      setPreview(dataUrl);
      setReport(null);
      mutation.mutate(dataUrl);
    } catch {
      toast.error("Could not read that image");
    }
  }

  function downloadReport() {
    if (!report) return;
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${report.lotId}-quality-report.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const name = profile.data?.fullName?.trim();
  const damagedPercent =
    report?.defects
      .filter((d) => /damag|split|bruis|crack|mould|mold|rot/i.test(d.category))
      .reduce((sum, d) => sum + Number(d.percentage || 0), 0) ?? 0;

  return (
    <AppShell>
      <section className="relative overflow-hidden rounded-3xl">
        <img
          src={heroImage}
          alt="Freshly harvested red onions spread on a jute sack"
          className="h-52 w-full object-cover sm:h-56"
        />
        <div className="bg-gradient-ink absolute inset-0" />
        <div className="absolute inset-y-0 left-0 flex max-w-lg flex-col justify-center gap-2 p-5 sm:p-8">
          <h1 className="font-display text-xl leading-tight font-extrabold text-primary-foreground sm:text-3xl">
            AI-Powered Onion Quality Assessment
          </h1>
          <p className="text-xs text-primary-foreground/85 sm:text-sm">
            {name
               ? `${name} — upload an image of your lot for instant quality analysis.`
              : "Upload an image of onions and get instant quality analysis with a detailed report."}
          </p>
          <Button
            variant="secondary"
            className="mt-1 h-11 w-fit rounded-xl px-5 font-semibold"
            onClick={() => inputRef.current?.click()}
            disabled={mutation.isPending}
          >
            <Upload className="size-4" /> Start New Analysis
          </Button>
        </div>
      </section>

      <section className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatDonut
          label="Grade A"
          percent={report?.gradeAPercent ?? 0}
          caption="Good quality"
          tone="grade-a"
          icon={<Award className="size-5" />}
        />
        <StatDonut
          label="URS (Undersized)"
          percent={report?.ursPercent ?? 0}
          caption="Undersized onions"
          tone="urs"
          icon={<Ruler className="size-5" />}
        />
        <StatDonut
          label="Damaged"
          percent={damagedPercent}
          caption="Damaged onions"
          tone="reject"
          icon={<AlertTriangle className="size-5" />}
        />
        <StatDonut
          label="Rejected"
          percent={report?.rejectPercent ?? 0}
          caption="Rotten / sprouted"
          tone="rejected"
          icon={<XCircle className="size-5" />}
        />
      </section>

      <section className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
        <div className="surface h-fit rounded-3xl p-5">
          <h2 className="font-display text-lg font-extrabold text-foreground">Upload &amp; Analyze</h2>
          <Label
            htmlFor="lot"
            className="mt-4 block text-xs font-semibold tracking-wide text-muted-foreground uppercase"
          >
            Lot / bag reference (optional)
          </Label>
          <Input
            id="lot"
            value={lotId}
            onChange={(e) => setLotId(e.target.value)}
            placeholder="e.g. Nashik-B12"
            className="mt-2 h-11 rounded-xl"
          />

          {preview ? (
            <div className="mt-4 overflow-hidden rounded-2xl border border-border">
              <img src={preview} alt="Onion lot submitted for grading" className="w-full" />
            </div>
          ) : (
            <div className="mt-4 flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border bg-muted/60 px-4 py-9 text-center">
              <ScanLine className="size-7 text-primary" />
              <p className="text-sm font-semibold text-foreground">Spread onions in one layer</p>
              <p className="text-xs text-muted-foreground">
                Even daylight, plain background, whole lot in frame
              </p>
            </div>
          )}

          <div className="mt-4 grid grid-cols-2 gap-3">
            <Button
              className="btn-violet h-11 rounded-xl font-semibold"
              onClick={() => navigate({ to: "/camera" })}
              disabled={mutation.isPending}
            >
              <Camera className="size-4" /> Camera
            </Button>
            <Button
              variant="secondary"
              className="h-11 rounded-xl font-semibold"
              onClick={() => inputRef.current?.click()}
              disabled={mutation.isPending}
            >
              <Upload className="size-4" /> Upload
            </Button>
          </div>

          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0])}
          />

          {mutation.isPending ? (
            <p className="mt-4 flex items-center justify-center gap-2 text-sm font-semibold text-primary">
              <Loader2 className="size-4 animate-spin" /> Inspecting bulbs for rot, sprouts, damage…
            </p>
          ) : null}
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
            <h2 className="min-w-0 truncate font-display text-lg font-extrabold text-foreground">
              Analysis Results
            </h2>
            <span
              className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${
                report
                  ? "bg-grade-a-soft text-grade-a"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {report ? "Completed" : mutation.isPending ? "Analysing" : "Awaiting image"}
            </span>
          </div>

          {report ? (
            <>
              <ReportView report={report} />
              <div className="grid grid-cols-3 gap-3">
                <Button
                  variant="secondary"
                  className="h-11 rounded-xl"
                  onClick={() => window.print()}
                >
                  <Printer className="size-4" /> Print
                </Button>
                <Button variant="secondary" className="h-11 rounded-xl" onClick={downloadReport}>
                  <Download className="size-4" /> Save
                </Button>
                <Button
                  className="btn-violet h-11 rounded-xl"
                  onClick={() => {
                    setPreview(null);
                    setReport(null);
                    mutation.reset();
                  }}
                >
                  <RotateCcw className="size-4" /> New
                </Button>
              </div>
            </>
          ) : (
            <div className="surface rounded-3xl p-8 text-center">
              <p className="text-sm font-semibold text-foreground">No analysis yet</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Upload or capture a photo of the lot to see Grade A, URS and reject percentages with
                a full defect breakdown.
              </p>
            </div>
          )}
        </div>
      </section>
    </AppShell>
  );
}
