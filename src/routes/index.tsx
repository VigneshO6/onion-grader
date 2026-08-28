import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { useRef, useState } from "react";
import {
  Camera,
  Upload,
  Loader2,
  ShieldCheck,
  ScanLine,
  RotateCcw,
  Printer,
  Download,
  AlertTriangle,
  Ruler,
  Boxes,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { analyzeOnionImage, type OnionReport } from "@/lib/onion.functions";
import heroImage from "@/assets/onion-hero.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "OnionGrade AI — Instant Onion Quality Grading" },
      {
        name: "description",
        content:
          "Scan an onion lot with your phone camera and get Grade A vs URS percentages, defect breakdown and a shareable digital quality report in seconds.",
      },
      { property: "og:title", content: "OnionGrade AI — Instant Onion Quality Grading" },
      {
        property: "og:description",
        content:
          "AI image analysis that spots rotten, sprouted, damaged and undersized onions and grades any lot without human bias.",
      },
    ],
  }),
  component: Index,
});

const MAX_DIM = 1280;

async function fileToCompressedDataUrl(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_DIM / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas unavailable");
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return canvas.toDataURL("image/jpeg", 0.85);
}

function Stat({
  label,
  value,
  hint,
  icon,
}: {
  label: string;
  value: string;
  hint?: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-card)]">
      <div className="flex items-center gap-2 text-muted-foreground">
        {icon}
        <span className="text-xs font-medium uppercase tracking-wide">{label}</span>
      </div>
      <p className="mt-2 font-display text-2xl font-semibold text-foreground">{value}</p>
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

function GradeBar({
  label,
  percent,
  tone,
  caption,
}: {
  label: string;
  percent: number;
  tone: "grade-a" | "urs" | "reject";
  caption: string;
}) {
  const bg =
    tone === "grade-a"
      ? "bg-grade-a"
      : tone === "urs"
        ? "bg-urs"
        : "bg-reject";
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <p className="text-sm font-semibold text-foreground">{label}</p>
        <p className="font-display text-lg font-semibold text-foreground">{percent}%</p>
      </div>
      <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-secondary">
        <div
          className={`h-full rounded-full ${bg} transition-[width] duration-700`}
          style={{ width: `${Math.min(100, percent)}%` }}
        />
      </div>
      <p className="mt-1 text-xs text-muted-foreground">{caption}</p>
    </div>
  );
}

function Index() {
  const analyze = useServerFn(analyzeOnionImage);
  const inputRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [lotId, setLotId] = useState("");
  const [report, setReport] = useState<OnionReport | null>(null);

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

  function reset() {
    setPreview(null);
    setReport(null);
    mutation.reset();
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

  return (
    <main className="mx-auto min-h-screen w-full max-w-xl bg-background pb-16">
      <header className="relative overflow-hidden rounded-b-[2rem]">
        <img
          src={heroImage}
          alt="Freshly harvested red onions spread on a jute sack"
          width={1536}
          height={1024}
          className="h-52 w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/85 via-foreground/40 to-foreground/10" />
        <div className="absolute inset-x-0 bottom-0 p-5">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-background/90 px-3 py-1 text-xs font-semibold text-primary">
            <ShieldCheck className="size-3.5" /> Bias-free digital grading
          </span>
          <h1 className="mt-2 font-display text-3xl font-bold leading-tight text-background">
            OnionGrade AI
          </h1>
          <p className="mt-1 max-w-sm text-sm text-background/85">
            Photograph a lot. Get Grade A and URS percentages, defect counts and an instant quality
            report.
          </p>
        </div>
      </header>

      <section className="px-5 pt-6">
        <div className="rounded-3xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
          <Label htmlFor="lot" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
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
              <img src={preview} alt="Onion lot submitted for grading" className="w-full object-cover" />
            </div>
          ) : (
            <div className="mt-4 flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border bg-muted/60 px-4 py-10 text-center">
              <ScanLine className="size-7 text-primary" />
              <p className="text-sm font-medium text-foreground">Spread onions in one layer</p>
              <p className="text-xs text-muted-foreground">
                Even daylight, plain background, whole lot in frame
              </p>
            </div>
          )}

          <div className="mt-4 grid grid-cols-2 gap-3">
            <Button
              size="lg"
              className="h-12 rounded-xl"
              onClick={() => cameraRef.current?.click()}
              disabled={mutation.isPending}
            >
              <Camera className="size-4" /> Capture
            </Button>
            <Button
              size="lg"
              variant="secondary"
              className="h-12 rounded-xl"
              onClick={() => inputRef.current?.click()}
              disabled={mutation.isPending}
            >
              <Upload className="size-4" /> Upload
            </Button>
          </div>

          <input
            ref={cameraRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0])}
          />

          {mutation.isPending ? (
            <p className="mt-4 flex items-center justify-center gap-2 text-sm font-medium text-primary">
              <Loader2 className="size-4 animate-spin" /> Inspecting bulbs for rot, sprouts, damage…
            </p>
          ) : null}
        </div>
      </section>

      {report ? (
        <section className="mt-6 space-y-5 px-5">
          <div className="rounded-3xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Quality report
                </p>
                <h2 className="font-display text-xl font-bold text-foreground">{report.lotId}</h2>
                <p className="text-xs text-muted-foreground">
                  {new Date(report.createdAt).toLocaleString()} · confidence{" "}
                  {Math.round(report.confidence * 100)}%
                </p>
              </div>
              <span className="rounded-full bg-accent px-3 py-1 text-xs font-semibold text-accent-foreground">
                {report.gradeAPercent >= 70
                  ? "Export ready"
                  : report.gradeAPercent >= 45
                    ? "Mixed lot"
                    : "Re-sort needed"}
              </span>
            </div>

            <div className="mt-5 space-y-4">
              <GradeBar
                label="Grade A"
                percent={report.gradeAPercent}
                tone="grade-a"
                caption="Firm, dry skin, ≥45 mm, no defects"
              />
              <GradeBar
                label="URS"
                percent={report.ursPercent}
                tone="urs"
                caption="Under reference standard — undersized or minor blemish"
              />
              <GradeBar
                label="Reject"
                percent={report.rejectPercent}
                tone="reject"
                caption="Rotten, mouldy, split or heavily sprouted"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Stat
              label="Bulbs counted"
              value={String(report.totalOnions)}
              icon={<Boxes className="size-4" />}
            />
            <Stat
              label="Avg diameter"
              value={`${report.avgDiameterMm} mm`}
              icon={<Ruler className="size-4" />}
            />
          </div>

          {report.defects.length ? (
            <div className="rounded-3xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
              <h3 className="flex items-center gap-2 font-display text-base font-semibold text-foreground">
                <AlertTriangle className="size-4 text-primary" /> Defect breakdown
              </h3>
              <ul className="mt-3 divide-y divide-border">
                {report.defects.map((d) => (
                  <li key={d.category} className="flex items-start justify-between gap-3 py-3">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{d.category}</p>
                      <p className="text-xs text-muted-foreground">{d.note}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="font-display text-sm font-semibold text-foreground">
                        {d.percentage}%
                      </p>
                      <p className="text-xs text-muted-foreground">{d.count} pcs</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="rounded-3xl border border-border bg-secondary p-5">
            <h3 className="flex items-center gap-2 font-display text-base font-semibold text-secondary-foreground">
              <Sparkles className="size-4" /> Inspector notes
            </h3>
            <p className="mt-2 text-sm text-secondary-foreground">{report.summary}</p>
            <p className="mt-3 text-sm font-medium text-primary">{report.recommendation}</p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Button variant="secondary" className="h-11 rounded-xl" onClick={() => window.print()}>
              <Printer className="size-4" /> Print
            </Button>
            <Button variant="secondary" className="h-11 rounded-xl" onClick={downloadReport}>
              <Download className="size-4" /> Save
            </Button>
            <Button className="h-11 rounded-xl" onClick={reset}>
              <RotateCcw className="size-4" /> New scan
            </Button>
          </div>
        </section>
      ) : null}
    </main>
  );
}
